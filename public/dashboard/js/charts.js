/* eslint-env browser, commonjs */
'use strict';

const Chart = require('../../../node_modules/chart.js/dist/Chart.min.js');

class Charts {
  constructor() {

    const stats = window.stats.charts;

    const data1 = {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        type: 'bar',
        label: 'Subscriptions',
        backgroundColor: 'rgb(216, 72, 57)',
        data: stats.subscriptions,
        borderColor: 'white',
        borderWidth: 0
      },
      {
        type: 'line',
        label: 'Follows',
        borderColor: 'rgb(44, 62, 80)',
        backgroundColor: 'rgba(44, 62, 80, 0.3)',
        data: stats.follows,
        borderWidth: 0,
        lineTension: 0
      }
      ]
    };

    const data2 = {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        type: 'bar',
        label: 'Donations',
        backgroundColor: 'rgb(52, 152, 219)',
        data: stats.donations.count,
        borderColor: 'white',
        borderWidth: 0
      },
      {
        type: 'bar',
        label: 'Amount',
        backgroundColor: 'rgb(33, 114, 167)',
        data: stats.donations.amount,
        borderColor: 'white',
        borderWidth: 0
      }
      ]
    };

    let options = {},
      ctx1,
      ctx2;

    window.onload = () => {
      ctx1 = document.getElementById('chart1').getContext('2d');
      ctx2 = document.getElementById('chart2').getContext('2d');

      options = {
        responsive: true,
        defaultFontFamily: '\'Roboto\', sans-serif',
        title: {
          display: false
        },
        scales: {
          xAxes: [{
            gridLines: {
              display: false
            }
          }],
          yAxes: [{
            gridLines: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              display: true,
              fontColor: 'rgba(0, 0, 0, 0.4)',
              beginAtZero: true,
              suggestedMin: 0,
              suggestedMax: 10
            }
          }]
        },
        tooltips: {
          mode: 'index',
          intersect: false,
          cornerRadius: 0,
          caretSize: 0,
          xPadding: 15,
          yPadding: 12
        },
        layout: {
          padding: 20
        }
      };

      this.chart1 = new Chart(ctx1, {
        type: 'bar',
        data: data1,
        options
      });
      this.chart2 = new Chart(ctx2, {
        type: 'bar',
        data: data2,
        options
      });
    };

  }

  compare(data) {

    new Promise(resolve => {

      let changed = false;

      for (let i = 0; i < data.subscriptions.length; i++) {
        if (data.subscriptions[i] !== this.chart1.data.datasets[0].data[i]) {

          this.chart1.data.datasets[0].data = data.subscriptions;

          changed = true;
          break;
        }
      }

      for (let i = 0; i < data.follows.length; i++) {
        if (data.follows[i] !== this.chart1.data.datasets[1].data[i]) {

          this.chart1.data.datasets[1].data = data.follows;

          changed = true;
          break;
        }
      }

      resolve(changed);

    }).then(changed => {
      if (changed) this.chart1.update();
    });


    new Promise(resolve => {

      let changed = false;

      for (let i = 0; i < data.donations.count.length; i++) {
        if (data.donations.count[i] !== this.chart2.data.datasets[0].data[i]) {

          this.chart2.data.datasets[0].data = data.donations.count;
          this.chart2.data.datasets[1].data = data.donations.amount;

          changed = true;
          break;
        }
      }

      resolve(changed);

    }).then(changed => {
      if (changed) this.chart2.update();
    });

  }

}

window.charts = new Charts();
