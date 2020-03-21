var all_data = [];
var statewise = {};
var maxConfirmed = 0;
var lastUpdated = "";

var confirmed_delta = 0;
var deaths_delta = 0;
var recovered_delta = 0;
var states_delta = 0;
let total = {};

var numStatesInfected = 0;
var stateWiseTableData;
var sort_field = 0;
var sort_order;

var table_columns = [
    {
        key: "state",
        display_name: "State"
    },
    {
        key: "confirmed",
        display_name: "Confirmed"
    },
    {
        key: "recovered",
        display_name: "Recovered"
    },
    {
        key: "deaths",
        display_name: "Deaths"
    },
    {
        key: "active",
        display_name: "Active"
    }
];

$.getJSON("https://api.covid19india.org/data.json",
function(result) {
    stateWiseTableData = result.statewise;
    const key_values = result.key_values[0];
    stateWiseTableData.forEach((stateData) => {
        if(stateData.state === "Total") {
            total = stateData;
        } else {
            if(parseInt(stateData.confirmed) > 0) {
                numStatesInfected++;
            }
            maxConfirmed = stateData.confirmed > maxConfirmed ? stateData.confirmed : maxConfirmed;
            statewise[stateData.state] = stateData;
        }
    });

    tablehtml = constructTable(stateWiseTableData);
    
    $("div#states-value").html(numStatesInfected);
    $("div#confvalue").html(total.confirmed);
    $("div#deathsvalue").html(total.deaths);
    $("div#recoveredvalue").html(total.recovered);
    $("strong#last-updated").html(key_values.lastupdatedtime);

    if(key_values.confirmeddelta)$("div#confirmed_delta").html("( +"+key_values.confirmeddelta+")");
    if(key_values.deceaseddelta) $("div#deaths_delta").html("( +"+key_values.deceaseddelta+")");
    if(key_values.recovereddelta)$("div#recovered_delta").html("( +"+key_values.recovereddelta+")");
    if(key_values.statesdelta)$("div#states_delta").html("( +"+key_values.statesdelta+")");

    initMapStuff();

});

$.getJSON("https://spreadsheets.google.com/feeds/cells/1nzXUdaIWC84QipdVGUKTiCSc5xntBbpMpzLm6Si33zk/"+ "o6emnqt"+"/public/values?alt=json",
function(result) {
    entries = result["feed"]["entry"]
    var dates = []
    var total_confirmed = [];
    var daily_confirmed = [];
    var daily_recovered = [];
    var total_recovered = [];
    var daily_deceased = [];
    var total_deceased = [];
    entries.forEach(function(item) {
        var row = item["gs$cell"]["row"] - 1;
        if(row == 0) {
            return;
        }
        if (cases[row] == null) {
            cases[row] = [];
        }

        var col = (item["gs$cell"]["col"] - 1)

        if(col==0) {
            dates.push(moment((item["gs$cell"]["$t"]).trim(),"DD MMM"));

        }

        if(col==1) {
            daily_confirmed.push((item["gs$cell"]["$t"]).trim());
        }

        if(col==2) {
            total_confirmed.push((item["gs$cell"]["$t"]).trim());
        }

        if(col==3) {
            daily_recovered.push((item["gs$cell"]["$t"]).trim());
        }

        if(col==4) {
            total_recovered.push((item["gs$cell"]["$t"]).trim());
        }

        if(col==5) {
            daily_deceased.push((item["gs$cell"]["$t"]).trim());
        }

        if(col==6) {
            total_deceased.push((item["gs$cell"]["$t"]).trim());
        }

    });

    initChartLite(dates, {
        container: "confirmed_chart",
        label: "Confirmed",
        data: daily_confirmed,
        line_color: "#3e95cd"
    });

    initChartLite(dates, {
        container: "death_chart",
        label: "Deceased",
        data: daily_deceased,
        line_color: "#c62828"
    }); 

    mergedChart(dates, {
        container: "total_charts",
        title: "Cumulative Trend",
        y_axis_label: "Total Cases",
        data: [
        {
            label: "Total Confirmed",
            data: total_confirmed,
            line_color: "#3e95cd",
        },
        {
            label: "Total Confirmed",
            data: total_recovered,
            line_color: "#009688" ,
        },{
            label: "Total Deceased",
            data: total_deceased,
            line_color: "#c62828",
        }
        ]});

    mergedChart(dates, {
        container: "daily_charts",
        title: "Daily Trend",
        y_axis_label: "Daily Cases",
        data: [
        {
            label: "Daily Confirmed",
            data: daily_confirmed,
            line_color: "#3e95cd",
        },
        {
            label: "Daily Recovered",
            data: daily_recovered,
            line_color: "#009688" ,
        },{
            label: "Daily Deceased",
            data: daily_deceased,
            line_color: "#c62828",
        }
    ]});
});

function is_touch_device() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch (e) {
        return false;
    }
}

function initMapStuff(){
    var map = L.map('map').setView([22.5, 82], 3);
    map.setMaxBounds(map.getBounds());
    map.setView([22.5, 82], 4);

    if(is_touch_device()){
        map.dragging.disable();
        map.tap.disable();
    }
``
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2hhZmVlcS1ldCIsImEiOiJjazgwZ2Jta20wZ2lxM2tsbjBmbnpsNGQyIn0.JyWxwnlx0oDopQ8JWM8YZA', {
    maxZoom: 6,
    minZoom: 4,
    id: 'mapbox/light-v9',
    tileSize: 512,
    zoomOffset: -1
}).addTo(map);


// control that shows state info on hover
var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function (props) {
    if(props){
        this._div.innerHTML = '<h4>'+props["NAME_1"]+'</h4>'+
        '<pre>Confirmed: '+statewise[props["NAME_1"]].confirmed+
        '<br>Recovered: '+statewise[props["NAME_1"]].recovered+
        '<br>Deaths   : '+statewise[props["NAME_1"]].deaths+
        '<br>Active   : '+statewise[props["NAME_1"]].active+"</pre>";
    }

};

info.addTo(map);

function style(feature) {
    var n = 0
    if(statewise[feature.properties["NAME_1"]]){
        n = statewise[feature.properties["NAME_1"]].confirmed;
    }

    return {
        weight: 1,
        opacity: 1,
        color: "#bfbfbf",
        fillOpacity: (n>0)*0.05 + (n/maxConfirmed)*0.9,
        fillColor: "red"
    };
}

function highlightFeature(e) {
    geojson.resetStyle();
    info.update();

    var layer = e.target;

    layer.setStyle({
        weight: 1,
        color: '#000000',
        dashArray: '',
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

var geojson;

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: highlightFeature
    });
}

geojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);
}

function getLocalTime(timestamp){
    try {
        // Assuming that the timestamp at hand is in IST, and is of the format
        // "March 17, 2020 at 10:11 pm", though the linient parser can handle sane versions of dates
        let localTime = new Date(timestamp.replace('at ','') + ' GMT+530');
        return moment(+localTime).from();
    } catch(e){
        return timestamp;
    }
}

function constructTable(stateWiseTableData) {
    var tablehtml = "<thead>";

    /* Construct Table Header */
    tablehtml += "<tr>";
    table_columns.forEach(function(column, i) {
        tablehtml += "<th><a href='' col_id='" + i + "' onclick='sort(this,event)'>" + column.display_name + "</a></th>";
    });
    tablehtml += "</tr></thead><tbody>";

    /* Construct Table Body */
    stateWiseTableData.forEach((stateData, index) => {
        if(stateData.state === "Total"){
            return;
        }

        tablehtml += "<tr>";
        table_columns.forEach(column => {
            if(parseInt(stateData.confirmed) > 0) {
                tablehtml += "<td>" + stateData[column.key] + "</td>";
            }
        })
        tablehtml += "</tr>";

    });

    /* Adding Total Row at end */
    tablehtml += '<tr class="totals">';
    table_columns.forEach(column => {
        tablehtml += "<td>" + total[column.key] + "</td>";
    });
    tablehtml += "</tr></tbody";

    $("table#prefectures-table").html(tablehtml);
    return tablehtml;
}

function sort(column, event) {
    event.stopPropagation();
    event.preventDefault();

    const col_id = $(column).attr("col_id");

    var total_ele = stateWiseTableData.splice(0, 1);
    
    sort_order = col_id == sort_field? sort_order : undefined;

    if(!sort_order) {
        sort_order = col_id == 0? "A" : "D"
    }

    const columnKey = table_columns[col_id].key;

    stateWiseTableData.sort((StateData1, StateData2) => {
        let value1 = StateData1[columnKey];
        let value2 = StateData2[columnKey];
        
        if(columnKey != "state") {
            value1 = parseInt(value1);
            value2 = parseInt(value2);
        }

        if(sort_order == "D"){
            return value1 > value2? -1 : 1;
        } else {
            return value1 > value2? 1 : -1;
        }
    })

    stateWiseTableData.unshift(total_ele[0]);

    sort_field = col_id;

    sort_order = sort_order == "A"? "D" : "A";

    constructTable(stateWiseTableData);
}



function initChart(dates, options) {


    var ctx = document.getElementById(options.container);
    
    Chart.defaults.global.elements.line.fill = false;
    Chart.defaults.global.tooltips.intersect = false;
    Chart.defaults.global.tooltips.mode = 'nearest';
    Chart.defaults.global.tooltips.position = 'nearest';
    Chart.defaults.global.legend.display = false;
    Chart.defaults.global.title.text=options.label;
    Chart.defaults.global.title.display=true;
    Chart.defaults.global.title.padding=35;
    Chart.defaults.global.title.fontSize=15;
    Chart.defaults.global.elements.line.tension=0.3;
    var max_value = Math.max(...options.data)
    new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              data: options.data,
              label: options.label,
              borderColor: options.line_color,
            }
          ]
        },
        
        options: {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
            yAlign: "bottom",
        },
        elements: {
            point:{
                radius: 0
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    suggestedMax: max_value + (max_value * 5 / 100),
                    precision:0,
                    callback : function(value,index,values){
                        console.log(value, index, values);
                        return value;
                    }
               },
               scaleLabel: {
                display: true,
                labelString: options.label + " cases"
            }
            }],xAxes: [{
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'MMM DD',
                    stepSize: 7,
                    displayFormats: {
                        'millisecond': 'MMM DD',
                        'second': 'MMM DD',
                        'minute': 'MMM DD',
                        'hour': 'MMM DD',
                        'day': 'MMM DD',
                        'week': 'MMM DD',
                        'month': 'MMM DD',
                        'quarter': 'MMM DD',
                        'year': 'MMM DD',
                        },
                },
                gridLines: {
                    color: "rgba(0, 0, 0, 0)",
                }
            }],
        }
    }
    });
    }

    function mergedChart(dates, options) {
        var ctx = document.getElementById(options.container);
    
    Chart.defaults.global.elements.line.fill = false;
    Chart.defaults.global.tooltips.intersect = false;
    Chart.defaults.global.tooltips.mode = 'nearest';
    Chart.defaults.global.tooltips.displayColors = true;
    Chart.defaults.global.tooltips.position = 'nearest';
    Chart.defaults.global.title.text=options.title;
    Chart.defaults.global.title.display=true;
    Chart.defaults.global.legend.display=true;
    Chart.defaults.global.title.padding=35;
    Chart.defaults.global.title.fontSize=15;
    
    var datasets = [];
    options.data.forEach(item => {
        datasets.push({
            data: item.data,
            label: item.label,
            borderColor: item.line_color,
            maxValue: Math.max(...item.data)
        })
    });


    new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: datasets
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
            mode: 'index',
            yAlign: "bottom",
        },
        elements: {
            point:{
                radius: 0
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    precision:0
               },
               scaleLabel: {
                display: true,
                labelString: options.y_axis_label
            }
            
            }],xAxes: [{
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'MMM DD',
                    stepSize: 7,
                    displayFormats: {
                        'millisecond': 'MMM DD',
                        'second': 'MMM DD',
                        'minute': 'MMM DD',
                        'hour': 'MMM DD',
                        'day': 'MMM DD',
                        'week': 'MMM DD',
                        'month': 'MMM DD',
                        'quarter': 'MMM DD',
                        'year': 'MMM DD',
                        },
                },
                gridLines: {
                    color: "rgba(0, 0, 0, 0)",
                }
            }],
        }
    }
    });
    }

    
    function initChartLite(dates, options) {
        var ctx = document.getElementById(options.container);
        
        Chart.defaults.global.elements.line.fill = false;
        Chart.defaults.global.tooltips.intersect = false;
        Chart.defaults.global.tooltips.mode = 'nearest';
        Chart.defaults.global.tooltips.position = 'average';
        Chart.defaults.global.tooltips.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        Chart.defaults.global.tooltips.displayColors = false;
        Chart.defaults.global.tooltips.borderColor = options.line_color;
        Chart.defaults.global.tooltips.borderWidth = 1;
        Chart.defaults.global.tooltips.titleFontColor = '#000';
        Chart.defaults.global.tooltips.bodyFontColor = '#000';
        Chart.defaults.global.tooltips.caretPadding = 4;

        Chart.defaults.global.legend.display = false;
        Chart.defaults.global.title.display=false;
        Chart.defaults.global.title.padding=35;
        Chart.defaults.global.title.fontSize=15;
        Chart.defaults.global.hover.intersect = false;

        var max_value = Math.max(...options.data)
        new Chart(ctx, {
            type: 'line',
            data: {
              labels: dates,
              datasets: [
                {
                  data: options.data,
                  label: options.label,
                  borderColor: options.line_color,
                }
              ]
            },
            
            options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 0,
                    right: 10,
                    top: 0,
                    bottom: 0
                }
            },
            tooltips: {
                mode: 'x',
                position: 'nearest',
            },
            elements: {
                point:{
                    radius: 0
                }
            },
            scales: {
                yAxes: [{
                    drawBorder: false,
                    ticks: {
                        display: false,
                        beginAtZero: true,
                        suggestedMax: max_value + (max_value * 5 / 100),
                        precision:0,
                   },
                   gridLines: {
                    display: false,
                       color: "rgba(0, 0, 0, 0)",
                }
                }],xAxes: [{
                    drawBorder: false,
                    type: 'time',
                    ticks: {
                        display: false
                    },
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM DD',
                        stepSize: 1,
                        displayFormats: {
                            'millisecond': 'MMM DD',
                            'second': 'MMM DD',
                            'minute': 'MMM DD',
                            'hour': 'MMM DD',
                            'day': 'MMM DD',
                            'week': 'MMM DD',
                            'month': 'MMM DD',
                            'quarter': 'MMM DD',
                            'year': 'MMM DD',
                            },
                    },
                    gridLines: {
                        display: false,
                        color: "rgba(0, 0, 0, 0)",
                    }
                }],
            }
        }
        });
        }
