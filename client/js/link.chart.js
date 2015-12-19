Chart.defaults.global.scaleFontColor = "#fff";


var defaultData = {
    datas: {
        labels: [],
        datasets: [
            {
                fillColor: "rgba(101, 163, 63, 0.2)",
                strokeColor: "rgb(101, 163, 63)",
                pointColor: "rgba(0, 0, 0, 0)",
                pointStrokeColor: "rgba(0, 0, 0, 0)",
                pointHighlightFill: "rgba(0, 0, 0, 0)",
                pointHighlightStroke: "rgba(0, 0, 0, 0)",
                data: [1000]
            },
            {
                fillColor: "rgba(230, 126, 34, 0.2)",
                strokeColor: "rgba(230, 126, 34,1.0)",
                pointColor: "rgba(0, 0, 0, 0)",
                pointStrokeColor: "rgba(0, 0, 0, 0)",
                pointHighlightFill: "rgba(0, 0, 0, 0)",
                pointHighlightStroke: "rgba(0, 0, 0, 0)",
                data: [1000]
            }
        ]
    }
};

function LinkChart(ctx) {
    var that = this;

    this.ctx = ctx;
    this.chart = undefined;
    this.datas = {
        eventsPerSecond: [],
        eventsSize: []
    };
    this.propertiesShow = ['eventsPerSecond', 'eventsSize'];
    this.maxValues = 180;
    this.counter = 0;
    this.chart = new Chart(this.ctx).Line(defaultData.datas, {
        animationSteps: 15,
        scaleUse2Y: true,
        pointDot: false,
        scaleGridLineColor : "rgba(255, 255, 255, 0.1)",
        responsive: true,
        maintainAspectRatio: false
    });
}

LinkChart.prototype.newMonitoringData = function(data) {
    var that = this;
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            if(typeof that.datas[key] == 'undefined')
                that.datas[key] = [];

            that.datas[key].push(data[key]);

            if(that.datas[key].length > that.maxValues)
                that.datas[key].splice(0, 1);
        }
    }

    var now = new Date();
    var dataToAdd = [];
    this.propertiesShow.forEach(function(prop) {
        dataToAdd.push(data[prop]);
    });

    if(this.counter % 5 != 0)
        this.chart.addData(dataToAdd, "");
    else
        this.chart.addData(dataToAdd, minDigits(now.getHours(), 2) + ':' + minDigits(now.getMinutes(), 2) + ":" + minDigits(now.getSeconds(), 2));


    if(this.chart.scale.xLabels.length > this.maxValues)
        this.chart.removeData();

    this.counter++;
}

LinkChart.prototype.oldMonitoringData = function(data) {
    var that = this;
    this.datas = data;

    for(var i = 0; i<this.chart.datasets[0].points.length; i++)
        this.chart.removeData();

    for(var i = 0; i<data[that.propertiesShow[0]].length; i++) {
        var dataToAdd = [];
        that.propertiesShow.forEach(function (prop) {
            dataToAdd.push(data[prop][i]);
        });

        var d = new Date(data.date[i]);
        that.chart.addData(dataToAdd, minDigits(d.getHours(), 2) + ':' + minDigits(d.getMinutes(), 2) + ":" + minDigits(d.getSeconds(), 2));

        if(this.counter % 5 != 0)
            this.chart.scale.xLabels[this.chart.scale.xLabels.length - 1] = "";

        this.counter++;
    }
}

function minDigits(n, digits) {
    var str = n + '';
    var length = str.length;
    var i = 0;
    while(i < (digits - length)) {
        str = '0' + str;
        i++;
    }

    return str + '';
}