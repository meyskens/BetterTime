package timeedit

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"golang.org/x/net/html"
)

type TimeEditAPI struct {
	baseURL string
}

func NewTimeEditAPI(baseURL string) *TimeEditAPI {
	return &TimeEditAPI{
		baseURL: baseURL,
	}
}

func (api *TimeEditAPI) prepareGetCall(path string) (*http.Request, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s%s", api.baseURL, path), nil)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "BetterTime/1.0")
	if err != nil {
		return req, err
	}
	return req, nil
}

func (api *TimeEditAPI) GetTimeTableForID(id string, from, to time.Time) ([]Event, error) {
	req, err := api.prepareGetCall(fmt.Sprintf("/web/public/ri.json?h=t&sid=3&p=%s.x%%2C%s.x&objects=%s&ox=0&types=0&fe=0", from.Format("20060102"), to.Format("20060102"), id))
	if err != nil {
		return nil, fmt.Errorf("failed to prepare request: %w", err)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error doing request: %v", err)
	}

	// parse json
	var data teData
	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		return nil, fmt.Errorf("error decoding json: %v", err)
	}

	events := []Event{}
	for _, event := range data.Reservations {
		events = append(events, event.ToEvent(data.Columnheaders))
	}

	return events, nil
}

func (api *TimeEditAPI) GetClassesForQuery(query string) ([]Class, error) {
	// the KUL class type is 11, not enough data to make it universal yet
	req, err := api.prepareGetCall(fmt.Sprintf("/web/public/objects.html?max=100&fr=t&partajax=t&im=f&sid=3&l=nl_NL&search_text=%s&types=11&objects=", url.QueryEscape(query)))
	if err != nil {
		return nil, fmt.Errorf("failed to prepare request: %w", err)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error doing request: %v", err)
	}
	defer resp.Body.Close()

	classes := []Class{}

	tokenizer := html.NewTokenizer(resp.Body)
	// look for <div>
	tokenType := tokenizer.Next()
	for tokenType != html.ErrorToken {
		token := tokenizer.Token()
		if tokenType == html.StartTagToken && token.Data == "div" {
			teID := ""
			name := ""
			// find data-id = "..."
			for _, attr := range token.Attr {

				if attr.Key == "data-id" {
					teID = attr.Val
				}
				if attr.Key == "data-name" {
					name = attr.Val
				}
			}
			if teID != "" && name != "" {
				classes = append(classes, Class{
					TimeEditID: teID,
					Name:       improveSearchClass(name),
				})
			}
		}
		tokenType = tokenizer.Next()
	}

	return classes, nil
}
