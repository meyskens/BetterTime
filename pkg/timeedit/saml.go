package timeedit

import (
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"golang.org/x/net/html"
)

// ain't no time for making this universal
var kulLogin = "https://cloud.timeedit.net/be_kuleuven/web/timeedit/sso/kul_saml2_gen?back=https%3A%2F%2Fcloud.timeedit.net%2Fbe_kuleuven%2Fweb%2Fstaff%2F"

var kulLoginPost = "https://idp.kuleuven.be/idp/profile/SAML2/Redirect/SSO?execution="

var kulSAMLCallback = "https://cloud.timeedit.net/be_kuleuven/web/timeedit/ssoResponse/kul_saml2_gen"

func (api *TimeEditAPI) doLogin() error {
	if api.lastLogin.After(time.Now().Add(time.Hour)) {
		return errors.New("logged in less than an hour ago i refuse to login")
	}

	api.lastLogin = time.Now()
	client := &http.Client{
		Jar: api.cookieJar,
	}

	req, err := http.NewRequest("GET", kulLogin, nil)
	if err != nil {
		return err
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}

	csrfToken, err := fetchCsrfToken(resp)
	if err != nil {
		return fmt.Errorf("error fetching csrf token on login page", err)
	}

	// gen post form data for stage 2
	form := url.Values{}
	form.Add("csrf_token", csrfToken)
	form.Add("shib_idp_ls_exception.shib_idp_session_ss", ``)
	form.Add("shib_idp_ls_success.shib_idp_session_ss", `false`)
	form.Add("shib_idp_ls_value.shib_idp_session_ss", ``)
	form.Add("shib_idp_ls_exception.shib_idp_persistent_ss", ``)
	form.Add("shib_idp_ls_success.shib_idp_persistent_ss", `false`)
	form.Add("shib_idp_ls_value.shib_idp_persistent_ss", ``)
	form.Add("shib_idp_ls_supported", ``)
	form.Add("_eventId_proceed", ``)

	req, err = http.NewRequest("POST", resp.Request.URL.String(), strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:103.0) Gecko/20100101 Firefox/103.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", "https://idp.kuleuven.be")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Referer", "https://idp.kuleuven.be/idp/profile/SAML2/Redirect/SSO?execution=e1s1")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "same-origin")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("Pragma", "no-cache")
	req.Header.Set("Cache-Control", "no-cache")

	resp, err = client.Do(req)
	if err != nil {
		return err
	}

	csrfToken, err = fetchCsrfToken(resp)
	if err != nil {
		return fmt.Errorf("error fetching csrf token on login page", err)
	}

	loc := resp.Request.URL
	execPrefix := loc.Query().Get("execution")[:len(loc.Query().Get("execution"))-1]

	// gen post form data
	form = url.Values{}
	form.Add("csrf_token", csrfToken)
	form.Add("username", os.Getenv("KUL_LOGIN"))
	form.Add("password", os.Getenv("KUL_PASSWORD"))
	form.Add("_eventId", `proceed`)

	req, err = http.NewRequest("POST", kulLoginPost+execPrefix+"2", strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:103.0) Gecko/20100101 Firefox/103.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", "https://idp.kuleuven.be")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Referer", loc.String())
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "same-origin")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("Pragma", "no-cache")
	req.Header.Set("Cache-Control", "no-cache")

	resp, err = client.Do(req)
	if err != nil {
		return err
	}

	samlResponse, err := fetchSAMLResponse(resp)
	if err != nil {
		return err
	}

	// gen post for SAML callback
	form = url.Values{}
	form.Add("SAMLResponse", samlResponse)

	req, err = http.NewRequest("POST", kulSAMLCallback, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	resp, err = client.Do(req)
	if err != nil {
		return err
	}

	// print body
	body, _ := ioutil.ReadAll(resp.Body)
	if !strings.Contains(string(body), os.Getenv("KUL_LOGIN")) {
		return errors.New("login failed")
	}

	return nil
}

func fetchCsrfToken(resp *http.Response) (string, error) {
	tokenizer := html.NewTokenizer(resp.Body)
	tokenType := tokenizer.Next()
	for tokenType != html.ErrorToken {
		token := tokenizer.Token()
		if token.Data == "input" {
			isCsrf := false
			for _, attr := range token.Attr {
				if attr.Key == "name" && attr.Val == "csrf_token" {
					isCsrf = true
					break
				}
			}
			if isCsrf {
				for _, attr := range token.Attr {
					if attr.Key == "value" {
						return attr.Val, nil
					}
				}
			}
		}
		tokenType = tokenizer.Next()
	}

	return "", fmt.Errorf("could not find csrf token")
}

func fetchSAMLResponse(resp *http.Response) (string, error) {
	tokenizer := html.NewTokenizer(resp.Body)
	tokenType := tokenizer.Next()
	for tokenType != html.ErrorToken {
		token := tokenizer.Token()
		if token.Data == "input" {
			isSAML := false
			for _, attr := range token.Attr {
				if attr.Key == "name" && attr.Val == "SAMLResponse" {
					isSAML = true
					break
				}
			}
			if isSAML {
				for _, attr := range token.Attr {
					if attr.Key == "value" {
						return attr.Val, nil
					}
				}
			}
		}
		tokenType = tokenizer.Next()
	}

	return "", fmt.Errorf("could not find SAMLResponse")
}
