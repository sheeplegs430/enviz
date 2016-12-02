var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

function draw(courses, links){
    let tooltip = d3.select("body").append("div").attr("class", "toolTip");
    let node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(courses)
        .enter().append("circle")
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
            tooltip.style("display", "none");
        });
    
    let link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", "1.5px")
        .attr("stroke", "black");

    let sim = d3.forceSimulation(courses)
        .force("center", d3.forceCenter(width/2, height/2))
        .force("collide", d3.forceCollide()
               .radius(d=>Math.sqrt(d.capacity)))
        .force("charge", d3.forceManyBody()
               .strength(30))
        .force("link", d3.forceLink()
               .id((d)=>d.id))
        .on("tick", ticked);
    
    sim.force("link")
        .links(links);
    
    function ticked(){
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node        
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }
}

function genLinks(courses){
    links = [];
    courses.forEach((course)=>{
        course.prerequisites.forEach((pre)=>{
           links.push({"source": course.id, "target": pre});
        });
    });

    return links;
}

d3.json("csbs.json", (error, courses)=>{
    if(error){
        console.log(error);
    }else{
        links = genLinks(courses);
        console.log(links);
        draw(courses, links);
    }
});