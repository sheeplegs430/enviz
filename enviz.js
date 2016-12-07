let svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

let tooltip = d3.select("body").append("div")
    .attr("class", "toolTip");

//Defined globally so it can be updated
let globalSim;

let colors = d3.scaleSequential()
    .interpolator(d3.interpolateBlues)

let colorScale = d3.scalePow()
    .exponent(0.8)
    //.clamp(true)
    .domain([0,0.5,1])
    .range(["rgb(247, 251, 255)","rgb(109, 174, 213)","rgb(8, 48, 107)"]);

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
    let nodes = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(courses).enter().append("circle")
            .attr("class", "node")
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
                    .html("<h1>" + d.name + "</h1>" +
                          "<hr/>" + 
                          "<p>"+ d.description + "</p>"); 
        
            })     
            .on("mouseout", function(d){ 
                tooltip
                    .style("display", "none");
            });
    
    /*
    * This is needed for the first initialization
    * So that we "r" is public before enrollment data
    * is available. Refactor when convenient this is
    * so hacky.
    */
    nodes.data().forEach(node =>{
        node["r"] = 40;
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
/**
* Reads in list of courses and links. Generates a D3 Simulation.
* Forces:
*   Center - TODO: remove once gravity and links implemented
*   Collide - Radius <-> node radius
*   Charge -   Strength <-> constant
*   Link - Distance <-> TODO: node radius + constant
*/

function initColorLegend(){    
    let colorLegendGroup = svg.append("g")
        .attr("class", "colorLegend")
        .attr("transform", "translate(20,20)");

    let colorLegend = d3.legendColor()
        .shapeWidth(60)
        .cells([.5, .75, 1, 1.25, 1.5])
        .title("Percentage of Class Full")
        .labels(["50%", "75%", "100%", "125%", "150%"])
        .orient('horizontal')
        .scale(colorScale);

    svg.select(".colorLegend")
        .call(colorLegend);
    
    return colorLegendGroup;
}

function initSizeLegend(){
    //circle scale for capacity of class
    let linearSize = d3.scaleLinear()
        .domain([80, 200])
        .range([20, 33]);

    svg.append("g")
      .attr("class", "legendSize")
      .attr("transform", "translate(20, 220)");

    let legendSize = d3.legendSize()
      .scale(linearSize)
      .shape("circle")
      .orient('vertical')
      .title("Number of Seats Available")
      .labels(["80", "110", "140", "170", "200"])
      .labelAlign("")
      .shapePadding(0);

    svg.select(".legendSize")
      .call(legendSize);
}

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
    svg.selectAll("circle.node").data().forEach((course)=>{
        course["enrollment"] = en[course["id"]]["enrollment"];
        course["capacity"] = en[course["id"]]["capacity"];
        course["r"] = Math.sqrt(course["capacity"])/.4;
    });
}

function updateLabels(){
    svg.selectAll("text.nodeLabel")
        .style("font-size", function(d){ 
        return ((2 * d.r - 10) / this.getComputedTextLength() * 10) + "px";
    })
}
function updateRadius(){
    svg.selectAll("circle.node")
        .attr("r", d => d.r);
}

function updateCollision(){
    let padding = 10;
    globalSim.force("collide")
        .radius(d => d.r + padding);
}

function updateColors() {
    svg.selectAll("circle.node")
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
    let colorLegendGroup = initColorLegend();
    
    globalSim = initSim(courses, links);
    globalSim.on("tick", ticked);
    function ticked(){
        linkGroup
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => {
                let dCenterToCenter = Math.sqrt(Math.pow(d.target.x - d.source.x, 2) + Math.pow(d.target.y - d.source.y, 2));
                let xNormalized = (d.target.x - d.source.x) / dCenterToCenter;
                let dCenterToRadius = dCenterToCenter - d.target.r;
                let dx = dCenterToRadius * xNormalized;
                return d.source.x + dx;
            })
            .attr("y2", d => {
                let dCenterToCenter = Math.sqrt(Math.pow(d.target.x - d.source.x, 2) + Math.pow(d.target.y - d.source.y, 2));
                let yNormalized = (d.target.y - d.source.y) / dCenterToCenter;
                let dCenterToRadius = dCenterToCenter - d.target.r;
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
