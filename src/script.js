//game.js - https://aaserver.net/gamejs
var c = new GameCanvas('gc');
c.hideScrollBar();
c.setSize(window.innerWidth, window.innerHeight);

CreateToolTip(["Click to create balls."]);

var s = new Scene();
s.slopes.push(new Slope(c.width / 2 - 200, c.height / 4 * 3, c.width / 2 + 200, c.height / 4 * 3));
s.slopes.push(new Slope(c.width / 2 - 200, c.height / 4 * 3 + 10, c.width / 2 + 200, c.height / 4 * 3 + 10));

s.slopes.push(new Slope(c.width / 2 - 200, c.height / 4 * 3 - 200, c.width / 2 - 200, c.height / 4 * 3));
s.slopes.push(new Slope(c.width / 2 - 210, c.height / 4 * 3 - 200, c.width / 2 - 210, c.height / 4 * 3));

s.slopes.push(new Slope(c.width / 2 + 200, c.height / 4 * 3, c.width / 2 + 200, c.height / 4 * 3 - 200));
s.slopes.push(new Slope(c.width / 2 + 210, c.height / 4 * 3, c.width / 2 + 210, c.height / 4 * 3 - 200));

s.points.push(new Point(c.width / 2, c.height / 2, false));
s.points.push(new Point(c.width / 2 + 7, c.height / 2 - 14, false));

var prevX = c.mouse.x;
var prevY = c.mouse.y;
var tick = 0;

loop();
function loop() {
  c.background("white");
  s.updateMouse(c.mouse.x, c.mouse.y, c.mouse.right, c.mouse.left);
  s.run();
  
  if (c.mouse.left) {
    s.points.push(new Point(c.mouse.x, c.mouse.y, false));
  }

  tick++;
  requestAnimationFrame(loop);
}

function Slope(x1, y1, x2, y2) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;

  this.friction = 0.7;

  this.angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1) - 0.5 * Math.PI;
  
  this.connectedArm = null;
  
  this.render = function() {
    c.line(this.x1, this.y1, this.x2, this.y2, 2, "black");
  }

  this.run = function(scene) {
    this.render();
  }

  this.checkCollision = function(point) {
    if (!point.fixed && !point.skipSlopeIDs.includes(this) && this.circleLineCollision({center: {x: point.x, y: point.y}, radius: point.size}, {p1: {x: this.x1, y: this.y1}, p2: {x: this.x2, y: this.y2}}).length > 0) {
      var power = 0.5;
      var x = Math.cos(this.angle) * power;
      var y = Math.sin(this.angle) * power;
      while (this.circleLineCollision({center: {x: point.x, y: point.y}, radius: point.size}, {p1: {x: this.x1, y: this.y1}, p2: {x: this.x2, y: this.y2}}).length > 0) {
        point.x += x;
        point.y += y;
        
        if (this.connectedArm) {
          if (!this.connectedArm.p1.fixed) {
            this.connectedArm.p1.x -= x;
            this.connectedArm.p1.y -= y;
          }
          if (!this.connectedArm.p2.fixed) {
            this.connectedArm.p2.x -= x;
            this.connectedArm.p2.y -= y;
          }
        }
        
        point.currentCollisionFriction = this.friction;
      }
    }
  }

  this.circleLineCollision = function(circle, line){
    var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = line.p2.x - line.p1.x;
    v1.y = line.p2.y - line.p1.y;
    v2.x = line.p1.x - circle.center.x;
    v2.y = line.p1.y - circle.center.y;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
    if(isNaN(d)){ // no intercept
      return [];
    }
    u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
    u2 = (b + d) / c;    
    retP1 = {};   // return points
    retP2 = {}  
    ret = []; // return array
    if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
      retP1.x = line.p1.x + v1.x * u1;
      retP1.y = line.p1.y + v1.y * u1;
      ret[0] = retP1;
    }
    if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
      retP2.x = line.p1.x + v1.x * u2;
      retP2.y = line.p1.y + v1.y * u2;
      ret[ret.length] = retP2;
    }       
    return ret;
  }
}

function Point(x, y, fixed) {
  this.x = x;
  this.y = y;
  this.oldX = x;
  this.oldY = y;

  this.ax = 0;
  this.ay = 0;

  this.damping = 0.995;
  this.currentCollisionFriction = 1;

  this.fixed = fixed;

  this.size = 7;
  this.color = "red";
  
  
  this.skipSlopeIDs = [];
  
  this.collide = function(otherPoint) {
    var length = c.distance(this.x, this.y, otherPoint.x, otherPoint.y);
    var target = this.size + otherPoint.size;
    
    if (length < target) {
      var ax = (this.x - otherPoint.x);
      var ay = (this.y - otherPoint.y);
      
      var factor = (length - target) / length;
      
      this.x -= ax * factor * 0.5;
      this.y -= ay * factor * 0.5;
      otherPoint.x += ax * factor * 0.5;
      otherPoint.y += ay * factor * 0.5;
    }
  }

  this.run = function(scene) {
    var vx = ((this.x - this.oldX) + this.ax) * this.damping * this.currentCollisionFriction ;
    var vy = ((this.y - this.oldY) + this.ay) * this.damping * this.currentCollisionFriction ;
    this.oldX = this.x; 
    this.oldY = this.y;

    this.currentCollisionFriction = 1;

    if (!this.fixed) {
      this.x = this.x + vx ;
      this.y = this.y + vy ;
      this.y += scene.gravity;
    }

    this.render(this.x, this.y);
  }

  this.render = function(x, y) {
    c.circle(x, y, this.size, this.color);
    //c.rect(x - this.size, y - this.size, this.size * 2, this.size * 2, this.color);
  }
}

function Arm(p1, p2, armLength) {
  this.p1 = p1;
  this.p2 = p2;
  
  this.connectedSlope = null;

  this.armLength = armLength;
  
  this.render = function() {
    c.line(this.p1.x, this.p1.y, this.p2.x, this.p2.y, 2, "black");
  }

  this.run = function(scene) {
    var distance = Math.sqrt((this.p1.x - this.p2.x) * (this.p1.x - this.p2.x) + (this.p1.y - this.p2.y) * (this.p1.y - this.p2.y));
    var error = this.armLength - distance;
    var percent = error / distance / 2;
    var offsetX = (this.p2.x - this.p1.x) * percent;
    var offsetY = (this.p2.y - this.p1.y) * percent;
    if (!this.p1.fixed) {
      this.p1.x -= offsetX ;
      this.p1.y -= offsetY ;
    }
    if (!this.p2.fixed) {
      this.p2.x += offsetX ;
      this.p2.y += offsetY ;
    }
    
    if (this.connectedSlope) {
      this.connectedSlope.x1 = this.p1.x;
      this.connectedSlope.x2 = this.p2.x;
      this.connectedSlope.y1 = this.p1.y;
      this.connectedSlope.y2 = this.p2.y;
      
      this.connectedSlope.angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x) - 0.5 * Math.PI;
    }
    
    this.render();
  }
}

function Scene() {
  this.mouse = {x: 0, y: 0, right: false, left: false};
  this.points = [];
  this.arms = [];
  this.slopes = [];

  this.gravity = 0.3;

  var selectedPoint;
  
  this.updateMouse = function(x, y, right, left) {
    this.mouse = {x: x, y: y, right: right, left: left};
  }

  this.run = function() {
    for (var i = 0; i < this.points.length; i++) {
      var p = this.points[i];

      if (this.mouse.left) {
        if (selectedPoint) {
          selectedPoint.x = this.mouse.x;
          selectedPoint.y = this.mouse.y;
        }
        else {
          if (Math.sqrt((this.mouse.x - p.x) * (this.mouse.x - p.x) + (this.mouse.y - p.y) * (this.mouse.y - p.y)) < p.size) {
            selectedPoint = p;
          }
        }
      }
      else
        selectedPoint = null;

      p.run(this);

      for (var j = 0; j < this.slopes.length; j++) {
        var s = this.slopes[j];
        if (s.checkCollision(p));
      }
      
      for (var j = 0; j < this.points.length; j++) {
        var pp = this.points[j];
        
        if (pp != p) {
          p.collide(pp);
        }
      }
    }
    for (var i = 0; i < this.arms.length; i++) {
      this.arms[i].run(this);
    }
    for (var j = 0; j < this.slopes.length; j++) {
      var s = this.slopes[j];
      s.run(this);
    }
  }
}

function CreateToolTip(tooltips) {
  var div = document.createElement('div');
  div.style.position = "fixed";
  div.style.width = "300px";
  div.style.height = "0px";
  div.style.top = "0";
  div.style.left = "0";
  div.style.right = "0";
  div.style.bottom = "0";
  div.style.zIndex = "2";
  div.style.backgroundColor = "red";
  
  var table = document.createElement('table');
  table.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
  table.style.padding = "10px";
  div.appendChild(table);
  
  var tr = document.createElement('tr');
  var th = document.createElement('th');
  var title = document.createTextNode("Tooltips");
  table.style.fontFamily = "'Lato', sans-serif";
  table.appendChild(tr);
  tr.appendChild(th);
  th.appendChild(title);
  
  for (var i = 0; i < tooltips.length; i++) {
    var t = tooltips[i];
    var a = document.createElement('tr');
    a.style.margin = "10px";
    table.appendChild(a);
    var b = document.createElement('td');
    a.appendChild(b);
    var text = document.createTextNode("• " + t);
    a.appendChild(text);
  }
  
  document.body.appendChild(div);
}