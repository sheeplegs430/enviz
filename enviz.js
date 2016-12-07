let svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

let tooltip = d3.select("body").append("div")
    .attr("class", "toolTip");

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
function addNodes(courses){
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
function addLinks(links){
    return svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links).enter().append("line")
            .attr("stroke", "black")
            .attr("stroke-width", "1.5px")
            .style("marker-end", "url(#arrow)");
}

/**
* Reads in list of courses and links. Generates a D3 Simulation.
* Forces:
*   Center - TODO: remove once gravity and links implemented
*   Collide - Radius <-> node radius
*   Charge -   Strength <-> constant
*   Link - Distance <-> TODO: node radius + constant
*/
function addSim(courses, links){
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

function addLabels(courses){
    return  svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(courses).enter().append("text")
                .attr("class", "nodeLabels")
                .text(d => d.id)
                .style("font-size", function(d) { 
        return ((2 * (Math.sqrt(d.capacity)/.4 + 4) - 10) / this.getComputedTextLength() * 10) + "px"; 
    });
}

function draw(courses, links){
    //Drawn in order
    let linkGroup = addLinks(links);
    let nodeGroup = addNodes(courses);
    let labelGroup = addLabels(courses);
    
    let sim = addSim(courses, links);
    sim.on("tick", ticked);
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
}

function updateEnrollment(en){
    svg.selectAll("circle").data().forEach((course)=>{
        course["enrollment"] = en[course["id"]]["enrollment"];
        course["capacity"] = en[course["id"]]["capacity"];
    });
}

d3.json("csbs.json", (error, courses)=>{
    if(error){
        console.log(error);
    }else{
        links = genLinks(courses);
        draw(courses, links);
    }
});

d3.json("enrollmentData/f16.json", (error, file)=>{
    let courseEnrollment = 
        file.reduce((dict, course)=>{
            dict[course.id] = 
                {"enrollment": course.enrollment,
                 "capacity": course.capacity};
            return dict;
        }, {});
    updateEnrollment(courseEnrollment);
});