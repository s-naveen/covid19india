var all_data = [];
var statewise = {};
var maxConfirmed = 0;
var lastUpdated = "";

var confirmed_delta = 0;
var deaths_delta = 0;
var recovered_delta = 0;
var states_delta = 0;

var numStatesInfected = 0;
var all_data;
var cases = [];

var sort_field = 0;
var sort_order;

// make sure to use Prod before submitting

// var sheet_id = "ob1elpb"; // Test
var sheet_id = "ovd0hzm"; // Prod

$.getJSON("https://spreadsheets.google.com/feeds/cells/1nzXUdaIWC84QipdVGUKTiCSc5xntBbpMpzLm6Si33zk/"+sheet_id+"/public/values?alt=json",
function(result) {
    // console.log(result)
    entries = result["feed"]["entry"]
    entries.forEach(function(item) {
        if (all_data[(item["gs$cell"]["row"] - 1)] == null) {
            all_data[(item["gs$cell"]["row"] - 1)] = [];
        }
        all_data[(item["gs$cell"]["row"] - 1)][(item["gs$cell"]["col"] - 1)] = (item["gs$cell"]["$t"]);
    });
    maxConfirmed = all_data[2][1];
    lastUpdated = getLocalTime(all_data[1][5]);
    confirmed_delta = all_data[1][6];
    deaths_delta = all_data[1][7];
    recovered_delta = all_data[1][8];
    states_delta = all_data[1][9];
    for(var i = 0; i<all_data.length;i++){
        all_data[i].splice(5); // Keep only 5 columns. State, Confirmed, Recovered, Deaths, Active
    }
    all_data.forEach(function(data){
        statewise[data[0]] = data;
    });

    tablehtml = constructTable(all_data);
    
    // console.log(numStatesInfected);
    $("div#states-value").html(numStatesInfected);
    $("div#confvalue").html(all_data[1][1]);
    $("div#deathsvalue").html(all_data[1][3]);
    $("div#recoveredvalue").html(all_data[1][2]);
    $("strong#last-updated").html(lastUpdated);

    if(confirmed_delta)$("div#confirmed_delta").html("( +"+confirmed_delta+")");
    if(deaths_delta) $("div#deaths_delta").html("( +"+deaths_delta+")");
    if(recovered_delta)$("div#recovered_delta").html("( +"+recovered_delta+")");
    if(states_delta)$("div#states_delta").html("( +"+states_delta+")");


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

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoianVuYWlkYmFidSIsImEiOiJqc2ZuNkhFIn0.rdicmW4uRhYuHZxEK9dRbg', {
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
        // console.log(props);
        // this._div.innerHTML = '<h4>Confirmed cases</h4><b>' + props["NAME_1"] + ": "+statewise[props["NAME_1"]][1]+"</b>";
        this._div.innerHTML = '<h4>'+props["NAME_1"]+'</h4>'+
        '<pre>Confirmed: '+statewise[props["NAME_1"]][1]+
        '<br>Recovered: '+statewise[props["NAME_1"]][2]+
        '<br>Deaths   : '+statewise[props["NAME_1"]][3]+
        '<br>Active   : '+statewise[props["NAME_1"]][4]+"</pre>";
    }

};

info.addTo(map);

function style(feature) {
    // console.log(feature.properties["NAME_1"]);
    // console.log(statewise[feature.properties["NAME_1"]]);
    var n = 0
    if(statewise[feature.properties["NAME_1"]]){
        // console.log(statewise[feature.properties["NAME_1"]][1]);
        n = statewise[feature.properties["NAME_1"]][1];
    }

    return {
        weight: 1,
        opacity: 1,
        color: "#bfbfbf",
        // dashArray: '3',
        fillOpacity: (n>0)*0.05 + (n/maxConfirmed)*0.9,
        // fillColor: "#000000"
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
        // fillOpacity: 0.7
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


function constructTable(all_data) {
    var tablehtml = "<thead>";
    for (var i = 0; i < all_data.length; i++) {
        if (i == 0) {
            tablehtml += "<tr>";
            all_data[i].forEach(function(data, i) {
                tablehtml += "<th><a href='' col_id='" + i + "' onclick='sort(this,event)'>" + data + "</a></th>";
            });
            tablehtml += "</tr></thead><tbody>";
        } else {
            if (i == 1) {
                continue;
            }
            tempdata = Array.from(all_data[i]);

            tempdata.splice(0, 1);
            allzero = true;
            tempdata.forEach(function(data) {
                if (data != 0) {
                    allzero = false;
                }
            });
            if (!allzero) {
                numStatesInfected++;
                tablehtml += "<tr>";
                all_data[i].forEach(function(data) {
                    tablehtml += "<td>" + data + "</td>";
                });
                tablehtml += "</tr>";
            }
        }
    }
    tablehtml += '<tr class="totals">';
    all_data[1].forEach(function(data) {
        tablehtml += "<td>" + data + "</td>";
    });
    tablehtml += "</tr>";

    tablehtml += "</tbody>";
    all_data.forEach(function(item) {
        tablehtml += item[0];
    });
    $("table#prefectures-table").html(tablehtml);
    return tablehtml;
}


function sort(column, event) {
    event.stopPropagation();
    event.preventDefault();

    const col_id = $(column).attr("col_id");

    var total_ele = all_data.splice(0, 2);
    
    sort_order = col_id == sort_field? sort_order : undefined;

    if(!sort_order) {
        sort_order = col_id == 0? "A" : "D"
    }

    all_data.sort((a, b) => {
        if(a == "Total") {
            return -1;
        }

        if(b == "Total") {
            return 0;
        }

        if(col_id != 0) {
            a[col_id] = parseInt(a[col_id]);
            b[col_id] = parseInt(b[col_id]);
        }

        if(sort_order == "D"){
            return a[col_id] > b[col_id]? -1 : 1;
        } else {
            return a[col_id] > b[col_id]? 1 : -1;
        }
    })

    all_data.unshift(total_ele[1]);
    all_data.unshift(total_ele[0]);

    sort_field = col_id;

    sort_order = sort_order == "A"? "D" : "A";

    constructTable(all_data);
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
