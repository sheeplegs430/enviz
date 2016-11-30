var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

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

    let sim = d3.forceSimulation(data)
        .force("center", d3.forceCenter(width/2, height/2))
        .force("collide", d3.forceCollide().radius(d=>Math.sqrt(d.capacity)/.2))
        .force("charge", d3.forceManyBody().strength(30))
        .on("tick", ticked);
    
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