(function() {
  var callWithJQuery;

  callWithJQuery = function(pivotModule) {
    if (typeof exports === "object" && typeof module === "object") {
      return pivotModule(require("jquery"), require("plotly.js"));
    } else if (typeof define === "function" && define.amd) {
      return define(["jquery", "plotly.js"], pivotModule);
    } else {
      return pivotModule(jQuery, Plotly);
    }
  };

  callWithJQuery(function($, Plotly) {
    var makePlotlyChart, makePlotlyScatterChart, makePlotlyTimeLineChart;
    makePlotlyChart = function(traceOptions, layoutOptions, transpose) {
      if (traceOptions == null) {
        traceOptions = {};
      }
      if (layoutOptions == null) {
        layoutOptions = {};
      }
      if (transpose == null) {
        transpose = false;
      }
      return function(pivotData, opts) {
        var colKeys, columns, d, data, datumKeys, defaults, fullAggName, groupByTitle, hAxisTitle, i, layout, result, rowKeys, rows, titleText, traceKeys;
        defaults = {
          localeStrings: {
            vs: "vs",
            by: "by"
          },
          plotly: {},
          plotlyConfig: {}
        };
        opts = $.extend(true, {}, defaults, opts);
        rowKeys = pivotData.getRowKeys();
        colKeys = pivotData.getColKeys();
        traceKeys = transpose ? colKeys : rowKeys;
        if (traceKeys.length === 0) {
          traceKeys.push([]);
        }
        datumKeys = transpose ? rowKeys : colKeys;
        if (datumKeys.length === 0) {
          datumKeys.push([]);
        }
        fullAggName = pivotData.aggregatorName;
        if (pivotData.valAttrs.length) {
          fullAggName += "(" + (pivotData.valAttrs.join(", ")) + ")";
        }
        data = traceKeys.map(function(traceKey) {
          var datumKey, j, labels, len, trace, val, values;
          values = [];
          labels = [];
          for (j = 0, len = datumKeys.length; j < len; j++) {
            datumKey = datumKeys[j];
            val = parseFloat(pivotData.getAggregator(transpose ? datumKey : traceKey, transpose ? traceKey : datumKey).value());
            values.push(isFinite(val) ? val : null);
            labels.push(datumKey.join('-') || ' ');
          }
          trace = {
            name: traceKey.join('-') || fullAggName
          };
          if (traceOptions.type === "pie") {
            if (!values.some(item => item !== 0)) {
                values = [];
                labels = [];
            }
            trace.values = values;
            trace.labels = labels.length > 0 ? labels : [fullAggName];
          } else {
            trace.x = transpose ? values : labels;
            trace.y = transpose ? labels : values;
          }
        if (traceOptions.extendFunctions) {
            for (var property in traceOptions.extendFunctions) {
                if (traceOptions.extendFunctions.hasOwnProperty(property)) {
                    trace[property] = traceOptions.extendFunctions[property](trace);
                }
            }
        }
          return $.extend(trace, traceOptions);
        });
        if (transpose) {
          hAxisTitle = pivotData.rowAttrs.join("-");
          groupByTitle = pivotData.colAttrs.join("-");
        } else {
          hAxisTitle = pivotData.colAttrs.join("-");
          groupByTitle = pivotData.rowAttrs.join("-");
        }
        titleText = fullAggName;
        if (hAxisTitle !== "") {
          titleText += " " + opts.localeStrings.vs + " " + hAxisTitle;
        }
        if (groupByTitle !== "") {
          titleText += " " + opts.localeStrings.by + " " + groupByTitle;
        }
        layout = {
          title: titleText,
          hovermode: 'closest',
          width: window.innerWidth / 1.4,
          height: window.innerHeight / 1.4 - 50
        };
        if (traceOptions.type === 'pie') {
          columns = Math.ceil(Math.sqrt(data.length));
          rows = Math.ceil(data.length / columns);
          layout.grid = {
            columns: columns,
            rows: rows
          };
          for (i in data) {
            d = data[i];
            d.domain = {
              row: Math.floor(i / columns),
              column: i - columns * Math.floor(i / columns)
            };
            if (data.length > 1) {
              d.title = d.name;
            }
          }
          if (data[0].labels.length === 1) {
            layout.showlegend = false;
          }
        } else {
          layout.xaxis = {
            title: transpose ? fullAggName : null,
            automargin: true
          };
          layout.yaxis = {
            title: transpose ? null : fullAggName,
            automargin: true
          };
        }
        if (opts.target) {
          result = $("<div>").appendTo($(opts.target));
        } else {
          result = $("<div>").appendTo($("body"));
        }
        Plotly.newPlot(result[0], data, $.extend(true, layout, layoutOptions, opts.plotly), opts.plotlyConfig);
        return result.detach();
      };
    };
    makePlotlyScatterChart = function() {
      return function(pivotData, opts) {
        var colKey, colKeys, data, defaults, j, k, layout, len, len1, renderArea, result, rowKey, rowKeys, v;
        defaults = {
          localeStrings: {
            vs: "vs",
            by: "by"
          },
          plotly: {},
          plotlyConfig: {}
        };
        opts = $.extend(true, {}, defaults, opts);
        rowKeys = pivotData.getRowKeys();
        if (rowKeys.length === 0) {
          rowKeys.push([]);
        }
        colKeys = pivotData.getColKeys();
        if (colKeys.length === 0) {
          colKeys.push([]);
        }
        data = {
          x: [],
          y: [],
          text: [],
          type: 'scatter',
          mode: 'markers'
        };
        for (j = 0, len = rowKeys.length; j < len; j++) {
          rowKey = rowKeys[j];
          for (k = 0, len1 = colKeys.length; k < len1; k++) {
            colKey = colKeys[k];
            v = pivotData.getAggregator(rowKey, colKey).value();
            if (v != null) {
              data.x.push(colKey.join('-'));
              data.y.push(rowKey.join('-'));
              data.text.push(v);
            }
          }
        }
        layout = {
          title: pivotData.rowAttrs.join("-") + ' vs ' + pivotData.colAttrs.join("-"),
          hovermode: 'closest',
          xaxis: {
            title: pivotData.colAttrs.join('-'),
            automargin: true
          },
          yaxis: {
            title: pivotData.rowAttrs.join('-'),
            automargin: true
          },
          width: window.innerWidth / 1.5,
          height: window.innerHeight / 1.4 - 50
        };
        renderArea = $("<div>", {
          style: "display:none;"
        }).appendTo($("body"));
        result = $("<div>").appendTo(renderArea);
        Plotly.newPlot(result[0], [data], $.extend(true, layout, opts.plotly), opts.plotlyConfig);
        result.detach();
        renderArea.remove();
        return result;
      };
    };

    /*
     Merge date intervals
     [ ['2022-12-13T00:56:20.461Z','2022-12-13T00:56:21.186Z'], ['2022-12-13T00:56:21.160Z','2022-12-13T00:56:23.186Z'] ]
     =>
     [ ['2022-12-13T00:56:20.461Z','2022-12-13T00:56:23.186Z'] ]
    */
    var mergeIntervals = function(intervals) {
        intervals.sort(function(a,b) {
            if (!a || !a[0] || typeof a[0].getMonth !== 'function') {
                return -1;
            } else if (!b || !b[0] || typeof b[0].getMonth !== 'function') {
                return 1;
            }
            return a[0].getTime() - b[0].getTime();
        });
        var result = [[intervals[0][0], intervals[0][1]]];
        for (var i = 1; i < intervals.length; i++) {
            if (intervals[i][0].getTime() <= result[result.length - 1][1].getTime()) {
                result[result.length - 1][1] = new Date(Math.max(result[result.length - 1][1].getTime(), intervals[i][1].getTime()));
            } else {
                result.push(intervals[i]);
            }
        }
        return result;
    };
      makePlotlyTimeLineChart = function() {
          return function(pivotData, opts) {
              var colKey, colKeys, data, defaults, j, k, layout, len, len1, renderArea, result, rowKey, rowKeys, v;
              defaults = {
                  localeStrings: {
                      vs: "vs",
                      by: "by"
                  },
                  plotly: {},
                  plotlyConfig: {}
              };
              opts = $.extend(true, {}, defaults, opts);

              layout = {
                  title: pivotData.rowAttrs.join("-") + ' vs ' + pivotData.colAttrs.join("-"),
                  xaxis: {
                      title: pivotData.colAttrs.join('-'),
                      automargin: true
                  },
                  yaxis: {
                      title: pivotData.rowAttrs.join('-'),
                      automargin: true
                  },
                  width: window.innerWidth / 1.5,
                  height: window.innerHeight / 1.4 - 50
              };
              var extendedLayout = $.extend(true, layout, opts.plotly);

              rowKeys = pivotData.getRowKeys();
              if (rowKeys.length === 0) {
                  rowKeys.push([]);
              }
              colKeys = pivotData.getColKeys();
              if (colKeys.length === 0) {
                  colKeys.push([]);
              }
              data = [];

              /*
             {x:['2022-12-13T00:56:20.461Z','2022-12-13T00:56:21.186Z','2022-12-13T00:56:21.186Z','2022-12-13T00:56:25.186Z','2022-12-13T00:56:25.186Z','2022-12-13T00:56:30.186Z'],
              y:[1,1,0,0,1,1],
              type:'scatter',
              line:{width:0, simplify:false},

              mode:'lines',
              name:'Run'}
               */

              // Prepocessing - prepare intervals for specified value
              var valueDataMap = {};
              var valueTextMap = {};
              for (j = 0, len = rowKeys.length; j < len; j++) {
                  rowKey = rowKeys[j];
                  var startTime = rowKey[0];
                  var endTime = rowKey[1];
                  var value = rowKey[2];
                  var text = rowKey[3];

                  valueTextMap[value] = text;

                  var valueData = [];
                  if (valueDataMap.hasOwnProperty(value)) {
                      valueData = valueDataMap[value];
                  }
                  valueData.push([startTime, endTime]);
                  valueDataMap[value] = valueData;
              }

              // Prepocessing - merge value intervals
              var valueKeys = Object.keys(valueDataMap);
              for(var i = 0; i < valueKeys.length; i++) {
                  valueDataMap[valueKeys[i]] = mergeIntervals(valueDataMap[valueKeys[i]]);
              }

              for(var i = 0; i < valueKeys.length; i++) {
                  var valueDataX = [];
                  var valueDataY = [];
                  var intervalPeaks = valueDataMap[valueKeys[i]];

                  // Preprocessing - add steps 1->0, 0->1
                  for(var j = 0; j < intervalPeaks.length; j++) {
                      if (intervalPeaks[j][0]) {
                          valueDataX.push(intervalPeaks[j][0]); // step 0->1
                          valueDataY.push(0);
                          valueDataX.push(intervalPeaks[j][0]); // peak start
                          valueDataY.push(1); // valueKeys[i]
                      }
                      if (intervalPeaks[j][1]) {
                          valueDataX.push(intervalPeaks[j][1]); // peak end
                          valueDataY.push(1); // valueKeys[i]
                          valueDataX.push(intervalPeaks[j][1]); // step 1->0
                          valueDataY.push(0);
                      }
                  }

                  data.push({
                      x: valueDataX,
                      y: valueDataY,
                      type: 'scatter',
                      mode: 'lines',
                      line: {color: opts.dataConfig && opts.dataConfig.colors && opts.dataConfig.colors(valueKeys[i]), width: 0, simplify: false},
                      fill: 'tozeroy',
                      fillcolor: opts.dataConfig && opts.dataConfig.colors && opts.dataConfig.colors(valueKeys[i]),
                      name: valueTextMap[valueKeys[i]]
                  });
              }

              renderArea = $("<div>", {
                  style: "display:none;"
              }).appendTo($("body"));
              result = $("<div>").appendTo(renderArea);
              Plotly.newPlot(result[0], data, extendedLayout, opts.plotlyConfig);
              result.detach();
              renderArea.remove();
              return result;
          };
      };
    $.pivotUtilities.makePlotlyChart = makePlotlyChart;
    $.pivotUtilities.makePlotlyScatterChart = makePlotlyScatterChart;
    $.pivotUtilities.makePlotlyTimeLineChart = makePlotlyTimeLineChart;
    return $.pivotUtilities.plotly_renderers = {
      "Horizontal Bar Chart": makePlotlyChart({
        type: 'bar',
        orientation: 'h'
      }, {
        barmode: 'group'
      }, true),
      "Horizontal Stacked Bar Chart": makePlotlyChart({
        type: 'bar',
        orientation: 'h'
      }, {
        barmode: 'relative'
      }, true),
      "Bar Chart": makePlotlyChart({
        type: 'bar'
      }, {
        barmode: 'group'
      }),
      "Stacked Bar Chart": makePlotlyChart({
        type: 'bar'
      }, {
        barmode: 'relative'
      }),
      "Line Chart": makePlotlyChart(),
      "Area Chart": makePlotlyChart({
        stackgroup: 1
      }),
      "Scatter Chart": makePlotlyScatterChart(),
        "Timeline Chart": makePlotlyTimeLineChart(),
      'Multiple Pie Chart': makePlotlyChart({
        type: 'pie',
        scalegroup: 1,
        hoverinfo: 'label+value',
        textinfo: 'none'
      }, {}, true)
    };
  });

}).call(this);

//# sourceMappingURL=plotly_renderers.js.map
