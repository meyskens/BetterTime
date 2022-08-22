package timeedit

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

type Event struct {
	OLA      string    `json:"ola"`
	ZCode    string    `json:"zCode"`
	Room     string    `json:"room"`
	Campus   string    `json:"campus"`
	RoomInfo string    `json:"roomInfo"`
	Start    time.Time `json:"start"`
	End      time.Time `json:"end"`
	Classes  []string  `json:"classes"`
	Type     string    `json:"type"`
	Teachers []string  `json:"teachers"`
}

type teReservation struct {
	Columns   []string `json:"columns"`
	Enddate   string   `json:"enddate"`
	Endtime   string   `json:"endtime"`
	ID        string   `json:"id"`
	Startdate string   `json:"startdate"`
	Starttime string   `json:"starttime"`
}

type teData struct {
	Columnheaders []string `json:"columnheaders"`
	Info          struct {
		Reservationcount int `json:"reservationcount"`
		Reservationlimit int `json:"reservationlimit"`
	} `json:"info"`
	Reservations []teReservation `json:"reservations"`
}

// Z(code) (ola name)
var olaRegex = regexp.MustCompile(`^Z(.\d*) (.*)$`)

func (te *teReservation) ToEvent(cols []string) Event {
	olaIndex := -1
	roomIndex := -1
	classesIndex := -1
	typeIndex := -1

	for i, col := range cols {
		if col == "OLA" {
			olaIndex = i
		}
		if col == "Ruimte" {
			roomIndex = i
		}
		if col == "Activiteitstype" {
			typeIndex = i
		}
		if col == "Klasgroep" {
			classesIndex = i
		}
	}

	// fetch ola name and zcode
	olaMatches := olaRegex.FindStringSubmatch(te.Columns[olaIndex])

	campus, roomName, info := improveRoom(te.Columns[roomIndex])

	startTime, _ := time.Parse("02-01-2006 15:04", fmt.Sprintf("%s %s", te.Startdate, te.Starttime))
	endTime, _ := time.Parse("02-01-2006 15:04", fmt.Sprintf("%s %s", te.Enddate, te.Endtime))

	return Event{
		OLA:      olaMatches[2],
		ZCode:    "Z" + olaMatches[1],
		Room:     roomName,
		Campus:   campus,
		RoomInfo: info,
		Start:    startTime,
		End:      endTime,
		Type:     te.Columns[typeIndex],
		Classes:  improveClasses(te.Columns[classesIndex]),
	}
}

// eg G 0.2 (NKorea) BEMT.00.0003
// G B202 - Practicum GLB.01.0202
// G P306B - Projectlokaal 1 GLP.03.306B
var kulRoomGiberishRegex = regexp.MustCompile(`^(.) ([a-zA-Z0-9.]*)\s*-?\s*(.*) .*\..*\..*$`)

func improveRoom(room string) (campus, roomName, info string) {
	room = strings.TrimSpace(room)

	if strings.Contains(room, "ONLINE") {
		return "", "Online", ""
	}

	matches := kulRoomGiberishRegex.FindStringSubmatch(room)
	if len(matches) == 0 {
		return
	}

	if matches[1] == "G" {
		campus = "Geel"
	} else if matches[1] == "L" {
		campus = "Lier"
	} else if matches[1] == "T" {
		campus = "Turnhout"
	} else {
		campus = matches[1]
	}

	roomName = matches[2]

	info = matches[3]

	return
}

func improveClasses(in string) []string {
	in = strings.TrimSpace(in)
	if in == "" {
		return []string{}
	}

	classes := []string{}

	for _, class := range strings.Split(in, ",") {
		class = strings.TrimSpace(class)
		if class == "" {
			continue
		}
		// remove EI and TI from class name for ITF
		class = strings.Replace(class, " EI", "", -1)
		class = strings.Replace(class, " TI", "", -1)

		classes = append(classes, class)
	}

	// remove duplicates
	classes = removeDuplicates(classes)

	return classes
}

func removeDuplicates(in []string) []string {
	out := []string{}
	hasSeen := map[string]bool{}
	for _, item := range in {
		if !hasSeen[item] {
			out = append(out, item)
			hasSeen[item] = true
		}
	}
	return out
}
