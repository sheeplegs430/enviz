let svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

let tooltip = d3.select("body").append("div")
    .attr("class", "toolTip");

function genLinks(courses){
    links = [];
    courses.forEach((course)=>{
        course.prerequisites.forEach((pre)=>{
           links.push({"source": course.id, "target": pre});
        });
    });

    return links;
}

function addNodes(courses){
    return svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(courses).enter().append("circle")
            .attr("r", d => Math.sqrt(d.capacity))
            .attr("fill", "red")
            .attr("stroke", "black")
            .attr("stroke-width", "1.5px")
            .on("mousemove", function(d){
                tooltip
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .html(d.id);
            })
            .on("mouseout", function(d){ 
                tooltip
                    .style("display", "none");
            });;
}

function addLinks(links){
    return svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links).enter().append("line")
            .attr("stroke", "black")
            .attr("stroke-width", "1.5px");
}

function addSim(courses, links){
    return d3.forceSimulation(courses)
        .force("center", d3.forceCenter(width/2, height/2))
        .force("collide", d3.forceCollide()
               .radius(d=>Math.sqrt(d.capacity)))
        .force("charge", d3.forceManyBody()
               .strength(30))
        .force("link", d3.forceLink()
               .id((d)=>d.id)
                .links(links));
}

function draw(courses, links){
    let nodeGroup = addNodes(courses);
    let linkGroup = addLinks(links);
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
    }
}

d3.json("csbs.json", (error, courses)=>{
    if(error){
        console.log(error);
    }else{
        links = genLinks(courses);
        draw(courses, links);
    }
});