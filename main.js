'use strict';

const JSONFileName = 'assets/springfield_converted.json';



var area_chart = {
  chart: {
    type: 'area'
  },
  title: {
    text: "<strong>Generation</strong> MW"
  },

  xAxis: {
    type: "datetime",
    crosshair: true
  },
  yAxis: {
    title: {
      text: 'MW'
    },
    labels: {
      formatter: function () {
        return this.value / 1000;
      }
    }
  },
  tooltip: {
    split: true,
  },
  plotOptions: {
    area: {
      stacking: 'normal',
      lineColor: '#666666',
      lineWidth: 1,
      marker: {
        lineWidth: 1,
        lineColor: '#666666'
      }
    }
  },
  series: []
};

var price_chart = {
  title: {
        text: 'Price'
    },

    xAxis: {
      type: "datetime",
      crosshair: true

    },
    yAxis: {
        title: {
            text: 'Number of Employees'
        }
    },

    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            },
            pointStart: 2010
        }
    }
};

var temp_chart = {
  title: {
        text: 'temperature'
    },

    xAxis: {
      type: "datetime",
      crosshair: true

    },
    yAxis: {
        title: {
            text: 'Number of Employees'
        }
    },

    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            },
            pointStart: 2010
        }
    }
};

// global data-structure to hold the energy breakup
var globalEnergyData = {
  name: [],
  data: []
};

// function to do deep-copy on the global data structure
function updateGlobalEnergyData(data) {
  globalEnergyData['data'] = [];
  for (var idx = 0; idx < data[0]['data'].length; idx ++) {
    var energyBreakup = data.map(elm => {return elm['data'][idx]});
    globalEnergyData['data'].push(energyBreakup);
  }
  globalEnergyData['keys'] = data.map(elm => elm['name']);
}

// this method reacts only onmouseover on any of the nodes in the shared graphs
function onMouseoverChart(e) {
  if (e['target'] === 'node') {
    var nodeSplit = e['targetid'].split('-');
    var nodeId = nodeSplit[nodeSplit.length - 1];
    if (Number.isInteger(parseInt(nodeId)) && parseInt(nodeId) < globalEnergyData['values'].length) {
      renderPieChart(parseInt(nodeId));
    }
  }
}

// the nodeId is basically the x-axis value
// the actual breakup is retrieved from the global data-structure
function renderPieChart(nodeId) {
  var pieDataSet = globalEnergyData['keys'].map(function(elm, idx) {
    return {
      text: elm.split('.')[elm.split('.').length - 1],
      values: [globalEnergyData['data'][nodeId][idx]]
    }
  });
  // console.log(pieDataSet);
  zingchart.exec('pieGrid', 'setseriesdata', {
    data : pieDataSet
  });
}


console.log('test');

// this function is responsible for plotting the energy on
// successfully loading the JSON data
// It also plots the pie chart for nodeId=0
function onSuccessCb(jsonData) {
    var energyData = jsonData.filter(function(elm) {
        return elm['type'] === 'power' && !(elm['id'] === "Springfield.fuel_tech.rooftop_solar.power");
    }).map(function(elm) {
        return {
          name: elm['id'],
          data: elm['history']['data'].filter(function(value, index, array) {
                return index % 6 == 0;
            }),
          pointStart: elm['history']['start']*1000,
          pointInterval: 1800000
        };
    });

    console.debug("this is the energyData")
    console.debug(energyData);
    updateGlobalEnergyData(energyData);
    area_chart.series = energyData;
    Highcharts.chart('energy_graph', area_chart);



    var priceData = jsonData.filter(function(elm) {
        return elm['type'] === 'price';
    }).map(function(elm) {
        return {
          data: elm['history']['data'],
          name: elm['id'],
          pointStart: elm['history']['start'] * 1000,
          pointInterval: 1800000
        };
    });

    console.debug("this is the priceData");
    console.debug(priceData);
    price_chart.series = priceData;
    Highcharts.chart('price_graph', price_chart);


    var tempData = jsonData.filter(function(elm) {
        return elm['type'] === 'temperature';
    }).map(function(elm) {
        return {
          data: elm['history']['data'],
          name: elm['id'],
          pointStart: elm['history']['start'] * 1000,
          pointInterval: 1800000
        };
    });

    console.debug("this is the tempData");
    console.debug(tempData);
    temp_chart.series = tempData;
    Highcharts.chart('temp_graph', temp_chart);


    //pushing data onto the charts


    zingchart.exec('sharedGrid', 'setseriesdata', {
      graphid: 1,
      data : priceData
    });
    zingchart.exec('sharedGrid', 'setseriesdata', {
      graphid: 2,
      data : tempData
    });
    renderPieChart(0);
}

// Utility function to fetch any file from the server
function fetchJSONFile(filePath, callbackFunc) {
    console.debug("Fetching file:", filePath);
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200 || httpRequest.status === 0) {
                console.info("Loaded file:", filePath);
                var data = JSON.parse(httpRequest.responseText);
                console.debug("Data parsed into valid JSON!");
                console.debug(data);
                if (callbackFunc) callbackFunc(data);
            } else {
                console.error("Error while fetching file", filePath,
                    "with error:", httpRequest.statusText);
            }
        }
    };
    httpRequest.open('GET', filePath);
    httpRequest.send();
}


// The entrypoint of the script execution
function doMain() {
    fetchJSONFile('assets/springfield_converted.json', onSuccessCb);
}

document.onload = doMain();
