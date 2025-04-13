document.addEventListener('DOMContentLoaded', () => {
    let COLORS = {
      harmonised: '#00b894',
      cannot_harm: '#d63031',
      harmonising: '#a29bfe',
      backlog: '#fdcb6e'
    };
    let DEFAULT_COLOR = '#0984e3';

    async function loadBarChart({ elementId, errorId, apiUrl, titleText, categoryKey, valueKey, useColors = false, preserveOrder = false }) {
      let chartEl = document.getElementById(elementId);
      let errorEl = document.getElementById(errorId);

      if (!chartEl || !errorEl) {
        console.error(`Missing DOM element: ${elementId} or ${errorId}`);
        return;
      }

      let chart = echarts.init(chartEl);

      try {
        let response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        let rawData = await response.json();

        let sortedData = preserveOrder ? rawData : rawData.sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));
        let categories = sortedData.map(row => row[categoryKey].trim());
        let values = sortedData.map(row => row[valueKey]);

        let option = {
          title: { text: titleText, left: 'center' },
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          legend: { data: ['Number of studies'] },
          xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { 
                interval: 0, 
                rotate: 0,
                fontSize: 14 
            }},
          yAxis: {
            type: 'value',
            name: 'Number of studies',
            axisLabel: {
                fontSize: 14
              }
          },
          label: { 
            show: true, 
            position: 'top',
            fontSize: 14 
          },
          series: [{
            type: 'bar',
            data: values,
            itemStyle: useColors ? {
              color: params => COLORS[categories[params.dataIndex]] || DEFAULT_COLOR
            } : undefined
          }]
        };

        chart.setOption(option);
        errorEl.textContent = '';
      } catch (error) {
        errorEl.textContent = `Failed to load chart: ${error.message}`;
        console.error(error);
      }
    };

    // Example test URLs — replace these with your working API endpoints
    loadBarChart({
      elementId: 'statusChart',
      errorId: 'statusChart_error',
      apiUrl: 'http://127.0.0.1:8000/plotly/status_bar',
      titleText: 'Current Harmonisation Status',
      categoryKey: 'Harm_status',
      valueKey: 'num_unique_studies',
      useColors: true,
      preserveOrder: false
    });

    loadBarChart({
        elementId: 'harmChart',
        errorId: 'harmChart_error',
        apiUrl: 'http://127.0.0.1:8000/plotly/harmed_six_month',
        titleText: 'Newly Harmonised Sumstats (Recent 6 months)',
        categoryKey: 'month',
        valueKey: 'num_studies',
        useColors: false,
        preserveOrder: true
      });
  });

  async function loadScatterPlot({ elementId, errorId, apiUrl, titleText, threshold }) {
    const chartEl = document.getElementById(elementId);
    const errorEl = document.getElementById(errorId);
    if (!chartEl || !errorEl) return;
  
    const chart = echarts.init(chartEl);
  
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
      const rawData = await response.json();
  
      const data = rawData.map(row => [
        parseInt(row.year),       // x: year
        parseFloat(row.Harm_drop_rate), // y: drop rate
        row.Study                 // extra for tooltip
      ]);
  
      const option = {
        title: {
          text: titleText,
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            return `Study: ${params.data[2]}<br>Year: ${params.data[0]}<br>Drop Rate: ${params.data[1]}`;
          }
        },
        xAxis: {
          type: 'category',
          name: 'Year',
          axisLabel: { fontSize: 14 },
          min: 'dataMin',
          max: 'dataMax',
          interval: 1
        },
        yAxis: {
          type: 'value',
          name: 'Drop Rate',
          axisLabel: { fontSize: 14 }
        },
        series: [{
          symbolSize: 10,
          type: 'scatter',
          data: data,
          ...(threshold && {
            markLine: {
              symbol: 'none',
              lineStyle: { type: 'dashed', color: 'red' },
              label: {
                formatter: `THOLD:    \n${threshold}     `,
                fontSize: 12,
                position: 'end',
                color: 'red'
              },
              data: [{ yAxis: threshold }]
            }
          })
        }]
      };
  
      chart.setOption(option);
      errorEl.textContent = '';
    } catch (error) {
      errorEl.textContent = `Failed to load chart: ${error.message}`;
      console.error(error);
    }
  }

  loadScatterPlot({
    elementId: 'scatter_array',
    errorId: 'scatter_array_error',
    apiUrl: 'http://127.0.0.1:8000/plotly/drop_rate/array',
    titleText: 'Drop Rate - Array Studies',
    threshold : 0.15
  });
  
  loadScatterPlot({
    elementId: 'scatter_seq',
    errorId: 'scatter_seq_error',
    apiUrl: 'http://127.0.0.1:8000/plotly/drop_rate/sequencing',
    titleText: 'Drop Rate - Sequencing Studies',
    threshold : 0.2
  });
  
  loadScatterPlot({
    elementId: 'scatter_mix',
    errorId: 'scatter_mix_error',
    apiUrl: 'http://127.0.0.1:8000/plotly/drop_rate/mix',
    titleText: 'Drop Rate - Mixed Studies'
  });
  