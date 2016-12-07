let svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

let tooltip = d3.select("body").append("div")
    .attr("class", "toolTip");

let defaultFile = "enrollmentData/f16.json";
//Defined globally so it can be updated
let globalSim;

//Portion of the class that is full (enrolled)
let fullColor = "rgb(8, 48, 107)";
//Portion of the class that is free (capacity - enrollment)
let emptyColor = "grey";

let colorScale = d3.scalePow()
    .exponent(2.8)
    .clamp(true)
    .domain([0, 1.30])
    .range([fullColor, "red"]);

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
    let links = [];
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
    let nodes = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(courses).enter().append("circle")
            .attr("class", "node")
            .attr("r", 40)
            .attr("fill", fullColor)
            .attr("stroke", emptyColor)
            .attr("stroke-width", "1.5px")
            .on("mousemove", function(d){
                tooltip
                    .style("width", "350px")
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px")
                    .style("display", "inline-block")
                    .html("<h1>" + d.name + "</h1>" +
                          "<hr/>" + 
                          "<p>"+ d.description + "</p>"); 

            })     
            .on("mouseout", function(d){ 
                tooltip
                    .style("display", "none");
            });
    
    nodes.data().forEach(node =>{
        node.r = 40;
    });
    
    return nodes;
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
            .attr("stroke-width", "2px")
            .style("marker-end", "url(#arrow)");
}

function initLabels(courses){
    return  svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(courses).enter().append("text")
                .attr("class", "nodeLabel")
                .text(d => d.id)
                .style("font-size", function(d) { 
        return ((2 * (Math.sqrt(d.capacity)/.4) - 10) / this.getComputedTextLength() * 10) + "px"; 
    });
}


function initColorLegend(){    
    let colorLegendGroup = svg.append("g")
        .attr("class", "colorLegend")
        .attr("transform", "translate(20,20)");

    let colorLegend = d3.legendColor()
        .shapeWidth(60)
        .cells([0, 0.25, 0.5, 0.75, 1, 1.25])
        .title("Percentage of Class Full")
        .labels(["0%", "25%", "50%", "75%", "100%", "125%"])
        .orient('horizontal')
        .scale(colorScale);

    svg.select(".colorLegend")
        .call(colorLegend);
    
    return colorLegendGroup;
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

/* UPDATE FUNCTIONS */
function updateData(en){
    svg.selectAll("circle.node").data().forEach((course)=>{
        course.enrolled = en[course.id].enrollment;
        course.capacity = en[course.id].capacity;
        course.fullness = course.enrolled/course.capacity;
        let rL = course.capacity - course.enrolled;
        course.roomLeft = rL > 0 ? Math.sqrt(rL)/.4 : 0;
        course.innerR = Math.sqrt(course.enrolled)/.4;
        course.outerR = Math.sqrt(course.capacity)/.4
    });
}
function updateLabels(){
    svg.selectAll("text.nodeLabel")
        .style("font-size", function(d){ 
            return ((2 * d.outerR - 10) / this.getComputedTextLength() * 10) + "px";
    })
}
function updateTips(){
    svg.selectAll("circle.node")
        .on("mousemove", function(d){
            tooltip
                .style("width", "350px")
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px")
                .style("display", "inline-block")
                .html("<h1>" + d.name + "</h1>" +
                      "<hr/>" + 
                      "<p>" + d.description + "</p>" +
                      "<hr/>" +
                      "<p>Enrolled: " + d.enrolled + "/" + d.capacity +
                      "</p>"); 
        })     
        .on("mouseout", function(d){ 
            tooltip
                .style("display", "none");
        });
}
function updateRadius(){
    svg.selectAll("circle.node")
        .attr("stroke-width", d => d.roomLeft)
        .attr("r", d => d.innerR);
}
function updateCollision(){
    let padding = 10;
    globalSim.force("collide")
        .radius(d => d.outerR + padding);
}
function updateColors() {
    svg.selectAll("circle.node")
        .attr("fill", d => colorScale(d.fullness));   
}
/**
* Loads in a new enrollment file and updates the visualization
*/
function updateEnrollment(filepath){
    d3.json(filepath, enrollment =>{
        let courseEnrollment = reduceEnrollment(enrollment);
        updateData(courseEnrollment);
        updateGraph();
        d3.select("div#buttons>p").html("<b>Viewing: </b>" + filepath);
    });
}

function updateGraph(){
    updateRadius();
    updateLabels();
    updateCollision();
    updateColors();
    updateTips();
}

d3.json("csbs.json", courses =>{
    let links = genLinks(courses);
    let linkGroup = initLinks(links);
    let nodeGroup = initNodes(courses);
    let labelGroup = initLabels(courses);
    let colorLegendGroup = initColorLegend();
    
    globalSim = initSim(courses, links);
    globalSim.on("tick", ticked);
    function ticked(){
        linkGroup
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => {
                let dCenterToCenter = dist(d.source.x,
                                            d.target.x,
                                            d.source.y,
                                            d.target.y);
                let xNormalized = (d.target.x - d.source.x) / dCenterToCenter;
                let dCenterToRadius = dCenterToCenter - d.target.outerR;
                let dx = dCenterToRadius * xNormalized;
                return d.source.x + dx;
            })
            .attr("y2", d => {
              let dCenterToCenter = dist(d.source.x,
                                            d.target.x,
                                            d.source.y,
                                            d.target.y);
                let yNormalized = (d.target.y - d.source.y) / dCenterToCenter;
                let dCenterToRadius = dCenterToCenter - d.target.outerR;
                let dy = dCenterToRadius * yNormalized;
                return d.source.y + dy;
            });

        nodeGroup    
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labelGroup
            .attr("x", d => d.x)
            .attr("y", d => d.y - 5);
    }
    
    updateEnrollment("enrollmentData/f16.json");
});

function dist(x1,x2,y1,y2){
   return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1,2));
}