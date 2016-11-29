var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var sim = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width/2, height/2));

function draw(data){
    let node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("r", d => Math.sqrt(d.capacity)/.2)
        .attr("fill", "red")
        .attr("stroke", "black")
        .attr("stroke-width", "1.5px");
    
//    let link = svg.append("g")
//        .attr("class", "links")
//        .selectAll("line")
//        .data(data)
//        .enter().append("line")
//        .attr("stroke-width", "1.5px")
//        .attr("stroke", "cyan");
    
    node.append("title")
        .text(d => d.name);
    sim.nodes(data)
        .on("tick", ticked);
//    sim.force("link")
//        .links(data.prerequisites);
    
    function ticked(){
//        link
//            .attr("x1", data.x)
//            .attr("y1", data.y)
//            .attr("x2", d => d.x)
//            .attr("y2", d => d.y);
        node        
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }
}

d3.json("csbs.json", (error, data)=>{
    if(error){
        console.log(error);
    }else{
        draw(data);
    }
});