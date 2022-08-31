package timeedit

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/bxcodec/httpcache"
	"golang.org/x/net/html"
)

var client = &http.Client{}

func init() {
	_, err := httpcache.NewWithInmemoryCache(client, false, time.Second*60*30)

	if err != nil {
		log.Fatal(err)
	}
}

type TimeEditAPI struct {
	baseURL  string
	typeUser string
}

func NewTimeEditAPI(baseURL string) *TimeEditAPI {
	return &TimeEditAPI{
		baseURL:  baseURL,
		typeUser: "public",
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
	req, err := api.prepareGetCall(fmt.Sprintf("/web/%s/ri.json?h=t&sid=3&p=%s.x%%2C%s.x&objects=%s&ox=0&types=0&fe=0", api.typeUser, from.Format("20060102"), to.Format("20060102"), id))
	if err != nil {
		return nil, fmt.Errorf("failed to prepare request: %w", err)
	}

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
	req, err := api.prepareGetCall(fmt.Sprintf("/web/%s/objects.html?max=100&fr=t&partajax=t&im=f&sid=3&l=nl_NL&search_text=%s&types=11&objects=", api.typeUser, url.QueryEscape(query)))
	if err != nil {
		return nil, fmt.Errorf("failed to prepare request: %w", err)
	}

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

func (api *TimeEditAPI) GetRoomsForCampus(query string) ([]Class, error) {
	classes := []Class{}
	hasMore := true
	start := 0
	for hasMore {
		var c []Class
		var err error
		c, hasMore, err = api.getRoomsForPage(query, start, 100)
		if err != nil {
			return nil, err
		}
		classes = append(classes, c...)
		start += 100
	}

	// sort by name
	sort.Slice(classes, func(i, j int) bool {
		return classes[i].Name < classes[j].Name
	})

	return classes, nil
}

func (api *TimeEditAPI) getRoomsForPage(query string, start, max int) ([]Class, bool, error) {
	hasMore := false

	// the KUL room type is 4, not enough data to make it universal yet
	req, err := api.prepareGetCall(fmt.Sprintf("/web/%s/objects.html?max=%d&fr=t&partajax=t&im=f&sid=3&l=nl_NL&types=4&fe=20.%s&objects=&start=%d", api.typeUser, max, url.QueryEscape(query), start))
	if err != nil {
		return nil, false, fmt.Errorf("failed to prepare request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, false, fmt.Errorf("error doing request: %v", err)
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

		// two ways to detect we have more, to be robust
		if tokenType == html.StartTagToken && token.Data == "a" {
			for _, attr := range token.Attr {
				if attr.Key == "data-text" && attr.Val == "Toon meer resultaat" {
					hasMore = true
					break
				}
			}
		}
		if tokenType == html.StartTagToken && token.Data == "div" {
			for _, attr := range token.Attr {
				if attr.Key == "id" && strings.Contains(attr.Val, "nextPage_") {
					hasMore = true
					break
				}
			}
		}
		tokenType = tokenizer.Next()
	}

	return classes, hasMore, nil
}
