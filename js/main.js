THREE.SpriteAlignment = {};
THREE.SpriteAlignment.topLeft = new THREE.Vector2( 1, -1 );
THREE.SpriteAlignment.topCenter = new THREE.Vector2( 0, -1 );
THREE.SpriteAlignment.topRight = new THREE.Vector2( -1, -1 );
THREE.SpriteAlignment.centerLeft = new THREE.Vector2( 1, 0 );
THREE.SpriteAlignment.center = new THREE.Vector2( 0, 0 );
THREE.SpriteAlignment.centerRight = new THREE.Vector2( -1, 0 );
THREE.SpriteAlignment.bottomLeft = new THREE.Vector2( 1, 1 );
THREE.SpriteAlignment.bottomCenter = new THREE.Vector2( 0, 1 );
THREE.SpriteAlignment.bottomRight = new THREE.Vector2( -1, 1 );

// Init of the scene
var scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

// Init of the main camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000000);
camera.position.set(2800, 2800, 2800);
camera.lookAt(new THREE.Vector3(0, -3000, 0));

// Init of the renderer
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var light1 = new THREE.SpotLight(0xffffff, 1);
light1.position.set(190000, 160000, 190000);
light1.castShadow = true;
scene.add(light1);
var light2 = new THREE.SpotLight(0xffffff, 1);
light2.position.set(-190000, 160000, -190000);
light2.castShadow = true;
scene.add(light2);
var light3 = new THREE.SpotLight(0xffffff, 1);
light3.position.set(0, -300000, 0);
light3.castShadow = true;
scene.add(light3);


//Controls for moving of camera
var controls = new THREE.OrbitControls( camera, renderer.domElement );
// controls.panningMode = THREE.HorizontalPanning;

var projector = new THREE.Projector();

//Raycaster for clickable objects
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

// Get the modal and its content
var modal = document.getElementById('myModal');
modal.style.display = 'none';
var modalContent = document.getElementById('myModalContent');

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
};

//When user clicks outside of modal, close the modal
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

//Initialization of listeners
document.addEventListener( 'mousedown', onDocumentMouseDown, false );
document.addEventListener( 'mousemove', onDocumentMouseMove, false );
document.addEventListener("contextmenu", function(e) { e.preventDefault(); });
window.addEventListener( 'resize', onWindowResize, false );

// The base position of the root node
var basePosition = new THREE.Vector3(0, 200, 0);

// Distance between 2 levels of the tree
var levelShift = 2000;
var delimiter = 150;
var dataset;
var levels = ["Workclass", "Education", "Marital_status", "Occupation", "Relationship",
    "Race", "Sex", "Hours_per_week", "Native_country", "Age"];
var nodes = [], lines = [], sprites = [];
var counts = {};
var depth = 3;
var duration = 750;

$.when(csvAjax()).then(createMenu);

function csvAjax() {
    return $.ajax({
        url: 'data/Adult_new.csv',
        dataType: 'text'
    }).done(successCallback);
}

function successCallback(data) {
    var lines = data.split("\n");
    var result = [];
    var headers = lines[0].split(",");
    for(var i = 1; i < lines.length; i++){
        var obj = {};
        var currentLine=lines[i].split(",");
        for(var j = 0; j < headers.length; j++){
            obj[headers[j]] = currentLine[j];
        }
        result.push(obj);
    }
    //return result; //JavaScript object
    dataset = result; //JSON
}

function createMenu() {
    var order = {
        '1. layer' : 'Workclass',
        '2. layer' : 'Education',
        '3. layer' : 'Marital_status',
        '4. layer' : 'Occupation',
        '5. layer' : 'Relationship',
        '6. layer' : 'Race',
        '7. layer' : 'Sex',
        '8. layer' : 'Hours_per_week',
        '9. layer' : 'Native_country',
        '10. layer' : 'Age',
        'Render view': function () {
            if(isCorrectLevels(this)) {
                levels = [];
                nodes = [];
                lines = [];
                sprites = [];
                counts = {};
                delimiter = 150;
                for (var i = 0; i < 10; i++) {
                    levels.push(this[(i + 1) + ". layer"]);
                }
                scene = new THREE.Scene();
                scene.background = new THREE.Color(0xcccccc);
                scene.add(light1);
                scene.add(light2);
                scene.add(light3);
                init();
            }
            else{
                alert('One or more categories are chosen more than once!');
            }
        }
    };

    var filter = {
        'Operator' : 'Less',
        'Count': 0,
        Reset: function () {
            resetFilter()
        }
    };

    var labels = {
        'Workclass': false,
        'Education': false,
        'Marital_status': false,
        'Occupation': false,
        'Relationship': false,
        'Race': false,
        'Sex': false,
        'Hours_per_week': false,
        'Native_country': false,
        'Age': false
    };

    var gui = new dat.gui.GUI();
    var orderFolder = gui.addFolder("Category Order");

    var layers =[];
    for (var i = 0; i < levels.length; i++){
        layers[i] = orderFolder.add(order, (i + 1) + '. layer', ["Workclass", "Education", "Marital_status", "Occupation", "Relationship", "Race", "Sex", "Hours_per_week", "Native_country", "Age"]);
    }
    layers[i] = orderFolder.add(order, 'Render view');

    var filterFolder = gui.addFolder("Filter");
    filterFolder.add(filter, "Operator", ["Less", "Greater"]).onChange(updateNodes);
    var controlCount = filterFolder.add(filter, "Count").name('Count').min(0).max(dataset.length).step(1);
    controlCount.onChange(updateNodes);
    function updateNodes() {
        for(var i = 0; i < nodes.length; i++) {
            nodes[i].material.color.setHex(0xff0000);
            nodes[i].material.opacity = 1;
        }
        switch (filter.Operator) {
            case "Less":
                for (i = 0; i < nodes.length; i++) {
                    if (nodes[i]['count'] >= filter["Count"]) {
                        nodes[i].material.color.setHex(0x558000);
                        nodes[i].material.opacity = 0.2;
                    }
                }
                break;
            case "Greater":
                for (i = 0; i < nodes.length; i++) {
                    if (nodes[i]['count'] < filter["Count"]) {
                        nodes[i].material.color.setHex(0x558000);
                        nodes[i].material.opacity = 0.2;
                    }
                }
                break;
        }
    }
    filterFolder.add(filter, 'Reset');
    function resetFilter() {
        for(var n in nodes){
            nodes[n].material.opacity = 1;
        }
    }

    var labelsFolder = gui.addFolder('Labels');
    for (i = 0; i < levels.length; i++){
        labelsFolder.add(labels, levels[i]).onChange(function (value) {
            var level;
            for(var i = 0; i < levels.length; i++){
                if(levels[i] === this.property){
                    level = i + 1;
                    break;
                }
            }
            for(i = 0; i < nodes.length; i++){
                if(nodes[i]['depth'] === level){
                    if(value) {
                        scene.add(nodes[i]['spritey']);
                    }
                    else{
                        scene.remove(nodes[i]['spritey']);
                    }
                }
            }
        });
    }

    init();
}

function init() {
    counts = getCountsFromDataset(counts);

    var sphereGeometry = new THREE.SphereBufferGeometry(dataset.length / delimiter, 32, 32);
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000, transparent: true, opacity: 1});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    sphere.position.set(basePosition.x, basePosition.y, basePosition.z);
    sphere['count'] = dataset.length;
    sphere['name'] = "Adults - all records";
    sphere['data'] = counts;
    sphere['expanded'] = depth > 1;
    sphere['depth'] = 0;
    scene.add(sphere);
    nodes.push(sphere);
    console.log(sphere);
    var spritey = makeTextSprite(" " + sphere['name'] + " ", { fontsize: 25, backgroundColor: {r:255, g:100, b:100, a:0.75} } );
    spritey.position.set(basePosition.x + 50, basePosition.y + sphere.geometry.parameters.radius, basePosition.z);
    sphere['spritey'] = spritey;
    scene.add(spritey);

    var text = "";
    delimiter = 50;
    computeRadius(depth, counts);
    sphere['childrenRadius'] = counts['childrenRadius'];
    sphere['children'] = generateConeTree(depth, sphere, counts, text);

    // var planeGeometry = new THREE.PlaneBufferGeometry( 200, 200, 32, 32 );
    // var planeMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00 } )
    // var plane = new THREE.Mesh( planeGeometry, planeMaterial );
    // plane.receiveShadow = true;
    // scene.add( plane );

    // var helper = new THREE.CameraHelper( light.shadow.camera );
    // scene.add( helper );

    animate();
}

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

//**********************
//** CUSTOM FUNCTIONS **
//**********************

// Generating cone tree
function generateConeTree(depth, parent, json, text) {
    var parentPosition = parent.position;
    var baseAngle = 2 * Math.PI / (Object.keys(json).length - 3);
    var angle = baseAngle;
    var radius = json['childrenRadius'];
    var children = [];   // This is the array of the children for the node on upper level
    for(var obj in json){
        if (obj !== 'count' && obj !== 'childrenRadius' && obj !== 'depth') {
            var x = radius * Math.cos(angle) + parentPosition.x;
            var z = radius * Math.sin(angle) + parentPosition.z;
            var sphereRadius;
            if(json[obj]['count'] !== undefined) {
                sphereRadius = json[obj]['count'] / delimiter;
            }
            else{
                sphereRadius = json[obj] / delimiter;
            }
            if(sphereRadius < 50){
                sphereRadius =  50;
            }
            var spriteRadius = radius + sphereRadius;
            var spriteX = spriteRadius * Math.cos(angle) + parentPosition.x;
            var spriteZ = spriteRadius * Math.sin(angle) + parentPosition.z;
            angle += baseAngle;
            var sphereGeometry = new THREE.SphereBufferGeometry(sphereRadius, 32, 32);
            var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000, transparent: true, opacity: 1});
            var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.castShadow = true;
            sphere.receiveShadow = false;
            sphere.position.set(x, parentPosition.y - levelShift, z);
            if(json[obj]['count'] !== undefined) {
                sphere['count'] = json[obj]['count'];
            }
            else{
                sphere['count'] = json[obj];
            }
            var desc = text + levels[parent['depth']] + ': ' + obj + '<br/>';
            sphere['name'] = desc;
            sphere['data'] = json[obj];
            sphere['expanded'] = depth > 1;
            sphere['depth'] = parent['depth'] + 1;
            sphere['childrenRadius'] = json[obj]['childrenRadius'];
            sphere['parentNode'] = parent;
            scene.add(sphere);
            nodes.push(sphere);
            children.push(sphere);

            var spritey = makeTextSprite(" " + obj + " ", { fontsize: 25, backgroundColor: {r:255, g:100, b:100, a:0.75} } );
            spritey.position.set(spriteX, sphere.position.y, spriteZ);
            spritey['name'] = "sprite " + desc;
            sphere['spritey'] = spritey;

            var lineMaterial = new THREE.LineBasicMaterial( { color: 0x558000 } );
            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(parentPosition);
            lineGeometry.vertices.push(sphere.position);
            var line = new THREE.Line(lineGeometry, lineMaterial);
            line['name'] = "line " + desc;
            scene.add(line);
            sphere['line'] = line;

            if (depth > 1) {
                sphere['children'] = generateConeTree(depth - 1, sphere, json[obj], desc);
            }
        }
    }
    return children;
}

// Compute the radius for different levels of depth
function computeRadius(depth, json){
    if(depth > 1) {
        for (var obj in json) {
            if (obj !== 'count' && obj !== 'depth') {
                computeRadius(depth - 1, json[obj]);
            }
        }
    }
    json['childrenRadius'] = 50;
    var count = Object.keys(json).length - 3;
    if(count > 1) {
        var baseAngle = 2 * Math.PI / count / 2;
        var radius;
        if(depth === 1){
            radius = getMaxCount(json);
        }
        else{
            radius = getMaxRadius(json);
        }
        json['childrenRadius'] = (radius * 2 + radius) / 2 / Math.sin(baseAngle);
    }
}

function getMaxCount(json) {
    var max = 0;
    for(var obj in json){
        if(json[obj]['count'] > max){
            max = json[obj]['count'];
        }
    }
    return max / delimiter < 50 ? 50 : max / delimiter;
}

function getMaxRadius(json) {
    var max = 0;
    for(var obj in json){
        if(json[obj]['childrenRadius'] > max){
            max = json[obj]['childrenRadius'];
        }
    }
    return max;
}

function getCountsFromDataset(json) {
    //json[levels[levelId]] = {};
    var depth = 1;
    json = {'count': dataset.length, 'depth': depth};
    var id = 0;
    for(var i = 0; i < dataset.length; i++){
        depth = 1;
        id = 0;
        json[dataset[i][levels[id]]] = processData(json[dataset[i][levels[id]]], ++depth);

        var tmp = json[dataset[i][levels[id++]]][dataset[i][levels[id]]];
        tmp = processData(tmp, ++depth);
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id]]] = tmp;

        id = 0;
        tmp = json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]];
        tmp = processData(tmp, ++depth);
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = tmp;

        id = 0;
        tmp = json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]];
        tmp = processData(tmp, ++depth);
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = tmp;

        id = 0;
        tmp = json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]];
        tmp = processData(tmp, ++depth);
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = tmp;

        id = 0;
        tmp = json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]];
        tmp = processData(tmp, ++depth);
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = tmp;

        id = 0;
        tmp = json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]];
        tmp = processData(tmp, ++depth);
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = tmp;

        id = 0;
        tmp = json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]];
        tmp = processData(tmp, ++depth);
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = tmp;

        id = 0;
        tmp = json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]];
        tmp = processData(tmp, ++depth);
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]] = tmp;

        id = 0;
        if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = 0;
        }
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]]++;
    }
    console.log(json);
    // console.log(JSON.stringify(json));
    return json;
}

function processData(json, depth) {
    if(json == null){
        json = {'count': 0};
    }
    json['count']++;
    json['depth'] = depth;
    return json;
}

function makeTextSprite( message, parameters ) {
    if ( parameters === undefined ) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface") ?
        parameters["fontface"] : "Arial";

    var fontsize = parameters.hasOwnProperty("fontsize") ?
        parameters["fontsize"] : 18;

    var borderThickness = parameters.hasOwnProperty("borderThickness") ?
        parameters["borderThickness"] : 4;

    var borderColor = parameters.hasOwnProperty("borderColor") ?
        parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };

    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
        parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

    //var spriteAlignment = parameters.hasOwnProperty("alignment") ?
    //	parameters["alignment"] : THREE.SpriteAlignment.topLeft;


    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = "Bold " + fontsize + "px " + fontface;

    // get size data (height depends only on font size)
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

    // background color
    context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
        + backgroundColor.b + "," + backgroundColor.a + ")";
    // border color
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
        + borderColor.b + "," + borderColor.a + ")";

    context.lineWidth = borderThickness;
    roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = "rgba(0, 0, 0, 1.0)";

    context.fillText( message, borderThickness, fontsize + borderThickness);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial(
        { map: texture } );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set(500, 500, 1);
    return sprite;
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function isCorrectLevels(obj) {
    var result = true;
    for(var i = 0; i < 10; i++){
        for(var j = 1; j < 10; j++){
            if(i !== j && obj[[(i + 1) + ". layer"]] === obj[[(j + 1) + ". layer"]]){
                result = false;
                break;
            }
        }
    }
    return result;
}

//Listener functions
function onDocumentMouseDown( event ) {
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    projector.unprojectVector( vector, camera );
    raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

    var intersects = raycaster.intersectObjects( nodes );
    if ( intersects.length > 0 ) {
        if(event.which === 1) {
            if (intersects[0].object['data'] !== undefined) {
                console.log(intersects[0].object['expanded']);
                if (intersects[0].object['expanded'] !== undefined) {
                    if (intersects[0].object['expanded'] !== true) {
                        console.log("Expanding sub-tree");
                        var json = intersects[0].object['data'];
                        intersects[0].object['expanded'] = true;
                        refreshDepth();
                        if(depth < intersects[0].object['depth'] + 1){
                            depth++;
                        }
                        console.log('Actual depth of the tree is ' + depth);
                        computeRadius(depth, counts);
                        intersects[0].object['childrenRadius'] = json['childrenRadius'];

                        var text = '';
                        if(intersects[0].object !== nodes[0]){
                            text = intersects[0].object['name'];
                        }
                        intersects[0].object['children'] =
                            generateConeTree(1, intersects[0].object, json, text);
                    }
                    else {
                        console.log("Collapsing sub-tree");
                        collapse(intersects[0].object);
                        // refreshDepth();
                        // computeRadius(1, counts);
                        // translateNodes(nodes[0]);
                    }
                    console.log(counts);
                    console.log(nodes[0]);
                    refreshRadius(intersects[0].object);
                }
            }
        }
        else if (event.which === 3){
            if ( intersects.length > 0 ) {
                modalContent.innerHTML =
                    intersects[0].object['name']
                    + '<br/>' + "Number of people is " + intersects[0].object['count'];
                modal.style.display = "block";
            }
            else{
                modal.style.display = "none";
            }
            console.log(intersects[0].object['childrenRadius']);
        }
    }
}

function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( nodes );
    if ( intersects.length > 0 && modal.style.display === 'none') {
        if(intersects[0].object.material.opacity === 1) {
            intersects[0].object.material.color.setHex(0x0000ff);
            if (intersects[0].object['line'] !== undefined) {
                intersects[0].object['line'].material.color.setHex(0x0000ff);
            }
            intersects[0].object['spritey'].material.color.setHex(0x81d4fa);
            var node = intersects[0].object['parentNode'];
            if (node !== undefined) {
                while (node !== nodes[0]) {
                    node.material.color.setHex(0x0000ff);
                    node['line'].material.color.setHex(0x0000ff);
                    node = node['parentNode'];
                }
                node.material.color.setHex(0x0000ff);
            }
        }
    }
    else if (modal.style.display === 'none'){
        for(var i = 0; i < nodes.length; i++) {
            if(nodes[i].material.opacity === 1) {
                nodes[i].material.color.setHex(0xff0000);
                nodes[i]['spritey'].material.color.setHex(0xff6464);
                if (i > 0) {
                    nodes[i]['line'].material.color.setHex(0x558000);
                }
            }
        }
    }

}

function onWindowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // cameraOrtho.left = - width / 2;
    // cameraOrtho.right = width / 2;
    // cameraOrtho.top = height / 2;
    // cameraOrtho.bottom = - height / 2;
    // cameraOrtho.updateProjectionMatrix();
    // updateHUDSprites();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var removeByAttr = function(arr, attr, value){
    var i = arr.length;
    while(i--){
        if( arr[i]
            && arr[i].hasOwnProperty(attr)
            && (arguments.length > 2 && arr[i][attr] === value ) ){

            arr.splice(i,1);

        }
    }
    return arr;
};

function collapse(node) {
    var count = node['children'].length;
    for(var i = 0; i < count; i++){
        if(node['children'][0]['expanded']){
            collapse(node['children'][0]);
        }
        var selected = scene.getObjectByName(node['children'][0]['name']);
        // console.log(selected);
        removeByAttr(nodes, 'name', selected.name);
        removeByAttr(node['children'], 'name', selected.name);
        scene.remove(selected);

        var selectedLine = scene.getObjectByName("line " + selected.name);
        // removeByAttr(lines, 'name', selectedLine.name);
        scene.remove(selectedLine);

        var selectedSprite = scene.getObjectByName("sprite " + selected.name);
        // removeByAttr(sprites, 'name', selectedSprite.name);
        scene.remove(selectedSprite);
    }
    node['expanded'] = false;
    node['children'] = [];
}

function refreshRadius(node) {
    var result = false;
    for (var n in nodes) {
        if (nodes[n] !== node && nodes[n]['depth'] === node['depth']
            && nodes[n]['expanded'] && node['expanded']) {
            var distance = node.position.distanceTo(nodes[n].position);
            if (distance < node['childrenRadius'] + nodes[n]['childrenRadius'] + 100) {
                result = true;
                console.log('Nodes ' + node['name'] + " and " + nodes[n]['name'] + " are colliding");
            }
        }
    }
    if (result) {
        translateNodes(node['parentNode']);
        if (node['parentNode'] !== undefined) {
            refreshRadius(node['parentNode']);
        }
    }
}

function translateNodes(node) {
    var radius = node['data']['childrenRadius'];
    node['childrenRadius'] = radius;
    var parentPosition = node.position;
    var baseAngle = 2 * Math.PI / (Object.keys(node['data']).length - 3);
    var angle = baseAngle;
    for(var child in node['children']){
        node['children'][child].position.x = radius * Math.cos(angle) + parentPosition.x;
        node['children'][child].position.z = radius * Math.sin(angle) + parentPosition.z;
        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(parentPosition);
        lineGeometry.vertices.push(node['children'][child].position);
        node['children'][child]['line'].geometry = lineGeometry;
        var spriteRadius = radius + node['children'][child].geometry.parameters.radius;
        var spriteX = spriteRadius * Math.cos(angle) + parentPosition.x;
        var spriteZ = spriteRadius * Math.sin(angle) + parentPosition.z;
        node['children'][child]['spritey'].position.set(spriteX, node['children'][child].position.y, spriteZ);
        angle += baseAngle;
        if(node['children'][child]['expanded']){
            translateNodes(node['children'][child]);
        }
    }
}

function refreshDepth() {
    depth = 0;
    for(var i = 0; i < nodes.length; i++){
        if(nodes[i]['depth'] > depth){
            depth = nodes[i]['depth'];
        }
    }
}