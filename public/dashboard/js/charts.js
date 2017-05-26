/* eslint-env browser */
/* global chartFollows:true, chartSubscriptions:true, chartDonations:true */
'use strict';

const Chart = require('../../../node_modules/chart.js/dist/Chart.min.js');

var chart1 = {
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    datasets: [{
        type: 'bar',
        label: 'Subscriber',
        backgroundColor: 'rgb(216, 72, 57)',
        data: chartSubscriptions,
        borderColor: 'white',
        borderWidth: 0
    }, {
        type: 'line',
        label: 'Follower',
        borderColor: 'rgb(44, 62, 80)',
        backgroundColor: 'rgba(44, 62, 80, 0.3)',
        data: chartFollows,
        borderWidth: 0,
        lineTension: 0
    }]
};

var chart2 = {
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    datasets: [{
        type: 'bar',
        label: 'Donations',
        backgroundColor: 'rgb(52, 152, 219)',
        data: chartDonations.count,
        borderColor: 'white',
        borderWidth: 0
    }, {
        type: 'bar',
        label: 'Amount',
        backgroundColor: 'rgb(33, 114, 167)',
        data: chartDonations.amount,
        borderColor: 'white',
        borderWidth: 0
    }]
};

window.onload = () => {
    var ctx1 = document.getElementById("chart1").getContext("2d"),
        ctx2 = document.getElementById("chart2").getContext("2d"),
        options = {
            responsive: true,
            defaultFontFamily: "'Roboto', sans-serif",
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
                        color: "rgba(0, 0, 0, 0.05)",
                        drawBorder: false
                    },
                    ticks: {
                        display: true,
                        fontColor: "rgba(0, 0, 0, 0.4)",
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

    window.chart1 = new Chart(ctx1, {
        type: 'bar',
        data: chart1,
        options: options
    });
    window.chart2 = new Chart(ctx2, {
        type: 'bar',
        data: chart2,
        options: options
    });
};
