let svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

let tooltip = d3.select("body").append("div")
    .attr("class", "toolTip");

let colors = d3.scaleSequential(d3.interpolateYlGnBu);
d3.schemeYlGnBu;

let globalSim;

var linear = d3.scaleLinear()
  .domain([0,50,200])
  //.range(["rgb(46, 73, 123)", "rgb(71, 187, 94)", ]);
  .range(["rgb(255, 255, 217)", "rgb(69, 180, 194)", "rgb(8, 29, 88)"]);

svg.append("g")
  .attr("class", "legendLinear")
  .attr("transform", "translate(20,20)");

var legendLinear = d3.legendColor()
  .shapeWidth(50)
  .cells(1, 50, 100, 150, 200)
  .orient('horizontal')
  .scale(linear);

svg.select(".legendLinear")
  .call(legendLinear);

//Contains reusable definitions
let defs = svg.append("defs");

//Arrowheads for use with lines
defs.append("marker")
        .attr("id","arrow")
        .attr("viewBox","0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
    .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class","arrowHead");

/**
* Reads in list of courses. For each course, create a link
* between itself and its prerequisites.
*/
function genLinks(courses){
    //TODO: cleaner code
    links = [];
    courses.forEach((course)=>{
        course.prerequisites.forEach((pre)=>{
           links.push({"source": pre, "target": course.id});
        });
    });

    return links;
}

/**
* Reads in list of courses. Generates an SVG group of circles.
* Circle:
*   Radius <-> capacity
*   TODO: Fill <-> scale(enrollment/capacity)
*/
function initNodes(courses){
    return svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(courses).enter().append("circle")
            .attr("r", 40)
            .attr("fill", "red")
            .attr("stroke", "black")
            .attr("stroke-width", "1.5px")
            .on("mousemove", function(d){
                tooltip
                    .style("width", "350px")
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px")
                    .style("display", "inline-block")
                    .html(d.name + "<br/>" + "<br/>" + d.description); 
        
            })     
            .on("mouseout", function(d){ 
                tooltip
                    .style("display", "none");
            });

}

/**
* Reads in list of links. Generates an SVG group of lines.
*/
function initLinks(links){
    return svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links).enter().append("line")
            .attr("stroke", "black")
            .attr("stroke-width", "1.5px")
            .style("marker-end", "url(#arrow)");
}

function initLabels(courses){
    return  svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(courses).enter().append("text")
                .attr("class", "nodeLabels")
                .text(d => d.id)
                .style("font-size", function(d) { 
        return ((2 * (Math.sqrt(d.capacity)/.4) - 10) / this.getComputedTextLength() * 10) + "px"; 
    });
}
/**
* Reads in list of courses and links. Generates a D3 Simulation.
* Forces:
*   Center - TODO: remove once gravity and links implemented
*   Collide - Radius <-> node radius
*   Charge -   Strength <-> constant
*   Link - Distance <-> TODO: node radius + constant
*/
function initSim(courses, links){
    return d3.forceSimulation(courses)
        .force("center", d3.forceCenter(width/2, height/2))
        .force("collide", d3.forceCollide()
               .radius(40))
        .force("charge", d3.forceManyBody()
               .strength(40))
        .force("link", d3.forceLink()
               .id((d)=>d.id)
               .links(links));
}

function reduceEnrollment(file){
    return file.reduce((dict, course)=>{
        dict[course.id] = {
            "enrollment": course.enrollment,
            "capacity": course.capacity
        };
        return dict;
    }, {});
}

function updateData(en){
    svg.selectAll("circle").data().forEach((course)=>{
        course["enrollment"] = en[course["id"]]["enrollment"];
        course["capacity"] = en[course["id"]]["capacity"];
    });
}

function updateLabels(){
    svg.selectAll("text")
        .style("font-size", function(d){ 
        return ((2 * (Math.sqrt(d.capacity)/.4) - 10) / this.getComputedTextLength() * 10) + "px";
    })
}
function updateRadius(){
    svg.selectAll("circle")
        .attr("r", d => Math.sqrt(d.capacity)/.4);
}

function updateCollision(){
    let padding = 10;
    globalSim.force("collide")
        .radius(d => Math.sqrt(d.capacity)/.4 + padding);
}

function updateColors() {
    svg.selectAll("circle")
        .attr("fill", d => colors(d.enrollment/d.capacity));   
}

/**
* Loads in a new enrollment file and updates the visualization
*/
function updateEnrollment(filepath){
    d3.json(filepath, enrollment =>{
        let courseEnrollment = reduceEnrollment(enrollment)
        updateData(courseEnrollment);
        updateRadius();
        updateLabels();
        updateCollision();
        updateColors();
    });
}

d3.json("csbs.json", courses =>{
    let links = genLinks(courses);
    
    let linkGroup = initLinks(links);
    let nodeGroup = initNodes(courses);
    let labelGroup = initLabels(courses);
    
    globalSim = initSim(courses, links);
    globalSim.on("tick", ticked);
    function ticked(){
        linkGroup
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        nodeGroup    
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labelGroup
            .attr("x", d => d.x)
            .attr("y", d => d.y - 5);
    }
    
    updateEnrollment("enrollmentData/f16.json");
});