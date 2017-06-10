/* eslint-env browser, commonjs */
/* global chartData */
'use strict';

const Chart = require('../../../node_modules/chart.js/dist/Chart.min.js');

class Charts {
  constructor() {

    this.chart1 = {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        type: 'bar',
        label: 'Subscriptions',
        backgroundColor: 'rgb(216, 72, 57)',
        data: chartData.subscriptions,
        borderColor: 'white',
        borderWidth: 0
      },
      {
        type: 'line',
        label: 'Follows',
        borderColor: 'rgb(44, 62, 80)',
        backgroundColor: 'rgba(44, 62, 80, 0.3)',
        data: chartData.follows,
        borderWidth: 0,
        lineTension: 0
      }
      ]
    };

    this.chart2 = {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        type: 'bar',
        label: 'Donations',
        backgroundColor: 'rgb(52, 152, 219)',
        data: chartData.donations.count,
        borderColor: 'white',
        borderWidth: 0
      },
      {
        type: 'bar',
        label: 'Amount',
        backgroundColor: 'rgb(33, 114, 167)',
        data: chartData.donations.amount,
        borderColor: 'white',
        borderWidth: 0
      }
      ]
    };

    window.onload = () => {
      this.ctx1 = document.getElementById('chart1').getContext('2d');
      this.ctx2 = document.getElementById('chart2').getContext('2d');

      this.options = {
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

      window.chart1 = new Chart(this.ctx1, {
        type: 'bar',
        data: this.chart1,
        options: this.options
      });
      window.chart2 = new Chart(this.ctx2, {
        type: 'bar',
        data: this.chart2,
        options: this.options
      });
    };

    this.changed = {
      chart1: false,
      chart2: false
    };

  }

  compare(data) {

    // Follows
    for (let i = 0; i < data.follows.length; i++) {

      if (data.follows[i] !== chartData.follows[i]) {

        chartData.follows = data.follows;
        this.chart1.data.datasets[1].data = chartData.follows;

        this.changed.chart1 = true;

        break;

      }
    }

    // Subscriptions
    for (let i = 0; i < data.subscriptions.length; i++) {

      if (data.subscriptions[i] !== chartData.subscriptions[i]) {

        chartData.subscriptions = data.subscriptions;
        this.chart1.data.datasets[0].data = chartData.subscriptions;

        this.changed.chart1 = true;

        break;

      }
    }

    // Donations
    for (let i = 0; i < data.donations.count.length; i++) {

      if (data.donations.count[i] !== chartData.donations.count[i]) {

        chartData.donations = data.donations.count;
        this.chart1.data.datasets[0].data = chartData.donations.count;
        this.chart1.data.datasets[1].data = chartData.donations.amount;

        this.changed.chart2 = true;

        break;

      }
    }

    if (this.changed.chart1 || this.changed.chart2) this.update();

  }

  update() {

    if (this.changed.chart1) {
      this.chart1.update();
      this.changed.chart1 = false;
    }

    if (this.changed.chart2) {
      this.chart2.update();
      this.changed.chart2 = false;
    }

  }
}

window.charts = new Charts();
