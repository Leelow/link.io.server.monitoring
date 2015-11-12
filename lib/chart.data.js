

function ChartData() {
    this.datas = {
        eventsPerSecond: [],
        eventsSize: []
    };
    this.maxValues = 180;
    this.eventsPerSecondCounter = 0;
    this.eventsSizeCounter = 0;
}

ChartData.prototype.appendData = function(event) {
    var that = this;

    this.eventsSizeCounter /= 1000;
    event.eventsPerSecond = this.eventsPerSecondCounter;
    event.eventsSize = this.eventsSizeCounter;
    event.date = new Date().getTime();

    for (var key in event) {
        if (event.hasOwnProperty(key)) {
            if(typeof that.datas[key] == 'undefined')
                that.datas[key] = [];

            that.datas[key].push(event[key]);

            if(that.datas[key].length > that.maxValues)
                that.datas[key].splice(0, 1);
        }
    }

    this.eventsPerSecondCounter = 0;
    this.eventsSizeCounter = 0;

    return event;
}

ChartData.prototype.newEvent = function(event) {
    this.eventsSizeCounter += JSON.stringify(event).length;
    this.eventsPerSecondCounter++;

}

ChartData.prototype.getOldData = function() {
    return this.datas;
}


module.exports = new ChartData();