var opts = {
  lines: 1, // The number of lines to draw
  angle: 0, // The length of each line
  lineWidth: 0.44, // The line thickness
  pointer: {
    length: 0.9, // The radius of the inner circle
    strokeWidth: 0.1,//.046, // The rotation offset
    color: '#000000' // Fill color
  },
  colorStart: '#BD362F',   // Colors51A351
  colorStop: '#BD362F',    // just experiment with them
  strokeColor: '#BBBBBB',   // to see which ones work best for you
  generateGradient: false
};

function setGauge(value, target){
  var target = document.getElementById(target); // your canvas element
  var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
  gauge.maxValue = 14; // set max gauge value
  gauge.animationSpeed = 1; // set animation speed (32 is default value)
  if (value >= 14) value = 13.9;
  gauge.set(14 - value); // set actual value
}
