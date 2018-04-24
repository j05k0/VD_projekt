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
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200000);
camera.position.set(2800, 2800, 2800);
camera.lookAt(new THREE.Vector3(0, -3000, 0));

// Init of the renderer
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var light1 = new THREE.SpotLight(0xffffff, 1);
light1.position.set(19000, 16000, 19000);
light1.castShadow = true;
scene.add(light1);
var light2 = new THREE.SpotLight(0xffffff, 1);
light2.position.set(-19000, 16000, -19000);
light2.castShadow = true;
scene.add(light2);

//Controls for moving of camera
var controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.panningMode = THREE.HorizontalPanning;

var projector = new THREE.Projector();

//Raycaster for clickable objects
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

// Get the modal and its content
var modal = document.getElementById('myModal');
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
// document.addEventListener( 'mousemove', onDocumentMouseMove, false );
window.addEventListener( 'resize', onWindowResize, false );

// The base position of the root node
var basePosition = new THREE.Vector3(0, 200, 0);

// The basic radius for the deepest level
var baseRadius = 500;

// Distance between 2 levels of the tree
var levelShift = 2000;
var delimiter = 150;
var dataset;
var levels = ["Workclass", "Education", "Marital_status", "Occupation", "Relationship",
    "Race", "Sex", "Hours_per_week", "Native_country", "Age"];
var age1 = '<17,25>', age2 = '<26,40', age3 = '<41, 65>', age4 = '<66, 90>';
var minAge1 = 17, maxAge1 = 25;
var minAge2 = 26, maxAge2 = 40;
var minAge3 = 41, maxAge3 = 65;
var minAge4 = 66, maxAge4 = 90;
var nodes = [], lines = [], sprites = [];
var depth = 2;
var duration = 750;

$.when(csvAjax()).then(createMenu);

function csvAjax() {
    return $.ajax({
        url: 'data/Adult.csv',
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
                for (var i = 0; i < 10; i++) {
                    levels.push(this[(i + 1) + ". layer"]);
                }
                scene = new THREE.Scene();
                scene.background = new THREE.Color(0xcccccc);
                scene.add(light1);
                scene.add(light2);
                init();
            }
            else{
                alert('One or more categories are chosen more than once!');
            }
        }
    };

    var filter = {
        'Max count': 0
    };

    var gui = new dat.gui.GUI();
    var orderFolder = gui.addFolder("Category Order");

    var layers =[];
    for (var i = 0; i < levels.length; i++){
        layers[i] = orderFolder.add(order, (i + 1) + '. layer', ["Workclass", "Education", "Marital_status", "Occupation", "Relationship", "Race", "Sex", "Hours_per_week", "Native_country", "Age"]);
    }
    layers[i] = orderFolder.add(order, 'Render view');

    var filterFolder = gui.addFolder("Filter");
    var controlCount = filterFolder.add(filter, "Max count").name('Max count').min(0).max(dataset.length).step(1);
    controlCount.onChange(function () {
        for (var i = 0; i < nodes.length; i++){
            nodes[i].material.color.setHex(0xff0000);
        }
        for (i = 0; i < nodes.length; i++){
            if(nodes[i]['count'] > filter["Max count"]){
                nodes[i].material.color.setHex(0x0000ff);
            }
        }
    });
    init();
}

function init() {
    var counts = {};
    counts = getCountsFromDataset(counts, 0);
    computeAge(counts);

    var sphereGeometry = new THREE.SphereBufferGeometry(dataset.length / delimiter, 32, 32);
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    sphere.position.set(basePosition.x, basePosition.y, basePosition.z);
    sphere['count'] = dataset.length;
    sphere['name'] = "Adults - all records";
    sphere['data'] = counts;
    sphere['expanded'] = depth > 1;
    scene.add(sphere);
    nodes.push(sphere);
    console.log(sphere);
    var spritey = makeTextSprite(" " + sphere['name'] + " ", { fontsize: 25, backgroundColor: {r:255, g:100, b:100, a:0.75} } );
    spritey.position.set(basePosition.x + 50, basePosition.y + sphere.geometry.parameters.radius, basePosition.z);
    scene.add( spritey );

    var count = Object.keys(counts).length - 1;
    var radiusArray = computeRadius(depth, count, counts);
    console.log(radiusArray);
    var text = "Adults";
    sphere['children'] = generateConeTree(radiusArray, depth, sphere.position, counts, text);

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
function generateConeTree(radiusArray, depth, parentPosition, json, text) {
    var baseAngle = 2 * Math.PI / (Object.keys(json).length - 1);
    var angle = baseAngle;
    var radius = radiusArray[depth - 1];
    var children = [];   // This is the array of the children for the node on upper level
    for(var obj in json){
        if (obj !== 'count') {
            var desc = text + " - " + obj;
            var x = radius * Math.cos(angle) + parentPosition.x;
            var z = radius * Math.sin(angle) + parentPosition.z;
            var sphereRadius = json[obj]['count'] / delimiter;
            if(sphereRadius < 50){
                sphereRadius =  50;
            }
            var spriteRadius = radius + sphereRadius;
            var spriteX = spriteRadius * Math.cos(angle) + parentPosition.x;
            var spriteZ = spriteRadius * Math.sin(angle) + parentPosition.z;
            angle += baseAngle;
            var sphereGeometry = new THREE.SphereBufferGeometry(sphereRadius, 32, 32);
            var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
            var lineMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff } );
            var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.castShadow = true;
            sphere.receiveShadow = false;
            sphere.position.set(x, parentPosition.y - levelShift, z);
            sphere['count'] = json[obj]['count'];
            sphere['name'] = desc;
            sphere['data'] = json[obj];
            sphere['expanded'] = depth > 1;
            scene.add(sphere);
            nodes.push(sphere);
            children.push(sphere);

            var spritey = makeTextSprite(" " + obj + " ", { fontsize: 25, backgroundColor: {r:255, g:100, b:100, a:0.75} } );
            spritey.position.set(spriteX, sphere.position.y, spriteZ);
            spritey['name'] = "sprite " + desc;
            scene.add( spritey );
            sprites.push(spritey);

            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(parentPosition);
            lineGeometry.vertices.push(sphere.position);
            var line = new THREE.Line(lineGeometry, lineMaterial);
            line['name'] = "line " + desc;
            scene.add(line);
            lines.push(line);

            if (depth > 1) {
                sphere['children'] = generateConeTree(radiusArray, depth - 1, sphere.position, json[obj], desc);
            }
        }
    }
    return children;
}

// Compute the radius for different levels of depth
function computeRadius(depth, count, json){
    var radiusArray = [];
    var baseAngle = 2 * Math.PI / count / 2;
    // var radius = getBaseRadius(json, count);
    var radius = baseRadius;
    radiusArray[0] = radius;
    for(var i = 1; i < depth; i++){
        var x = (radius * 2 + radius) / 2 / Math.sin(baseAngle);
        radiusArray[i] = x;
        radius = x;
    }
    return radiusArray;
}

function getBaseRadius(json, count) {
    var max = 0;
    for(var obj in json){
        if(json[obj]['count'] > max){
            max = json[obj]['count'];
        }
    }
    max /= delimiter;
    max = max < 50 ? 50 : max;

}

function getCountsFromDataset(json) {
    //json[levels[levelId]] = {};
    json = {'count': dataset.length};
    var id = 0;
    for(var i = 0; i < dataset.length; i++){
        id = 0;
        if(json[dataset[i][levels[id]]] == null){
            json[dataset[i][levels[id]]] = {'count': 0};
        }
        json[dataset[i][levels[id]]]['count']++;

        if(json[dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id]]] = {'count': 0};
        }
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id]]]['count']++;

        id = 0;
        if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = {'count': 0};
        }
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]]['count']++;

        id = 0;
        if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = {'count': 0};
        }
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]]['count']++;

        id = 0;
        if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = {'count': 0};
        }
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]]['count']++;

        id = 0;
        if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = {'count': 0};
        }
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]]['count']++;

        id = 0;
        if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = {'count': 0};
        }
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]]['count']++;

        id = 0;
        if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = {'count': 0};
        }
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]]['count']++;

        id = 0;
        if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = {'count': 0};
        }
        id = 0;
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]]['count']++;

        //TODO make a function with this mess
        if(levels[id] === 'Age'){
            if(dataset[i][levels[id]] >= minAge1 && dataset[i][levels[id]] <= maxAge1){
                id = 0;
                if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age1] == null){
                    id = 0;
                    json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age1] = 0;
                }
                id = 0;
                json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age1]++;
            }
            else if(dataset[i][levels[id]] >= minAge2 && dataset[i][levels[id]] <= maxAge2){
                id = 0;
                if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age2] == null){
                    id = 0;
                    json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age2] = 0;
                }
                id = 0;
                json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age2]++;
            }
            else if(dataset[i][levels[id]] >= minAge3 && dataset[i][levels[id]] <= maxAge3){
                id = 0;
                if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age3] == null){
                    id = 0;
                    json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age3] = 0;
                }
                id = 0;
                json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age3]++;
            }
            else if(dataset[i][levels[id]] >= minAge4 && dataset[i][levels[id]] <= maxAge4){
                id = 0;
                if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age4] == null){
                    id = 0;
                    json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age4] = 0;
                }
                id = 0;
                json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][age4]++;
            }
        }
        else{
            id = 0;
            if(json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] == null){
                id = 0;
                json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]] = 0;
            }
            id = 0;
            json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]]++;
        }
    }
    console.log(json);
    // console.log(JSON.stringify(json));
    return json;
}

function computeAge(json) {
    var idx = 0;
    while(levels[idx] !== 'Age'){
        idx++;
    }

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
        { map: texture, useScreenCoordinates: false } );
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
    //event.preventDefault();
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    projector.unprojectVector( vector, camera );
    raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

    var intersects = raycaster.intersectObjects( nodes );
    if ( intersects.length > 0 ) {
        if(intersects[0].object['data'] !== undefined) {
            console.log(intersects[0].object['expanded']);
            if (intersects[0].object['expanded'] !== undefined) {
                if (intersects[0].object['expanded'] !== true) {
                    console.log("Expanding sub-tree");
                    // console.log(intersects[0].object['name']);
                    // console.log(intersects[0].object['data']);
                    depth = 1;
                    var json = intersects[0].object['data'];
                    var count = Object.keys(json).length - 1;
                    var radiusArray = computeRadius(depth, count);
                    // console.log(radiusArray);
                    intersects[0].object['expanded'] = true;
                    intersects[0].object['children'] =
                        generateConeTree(radiusArray, depth, intersects[0].object.position, json, intersects[0].object['name']);
                }
                else{
                    console.log("Collapsing sub-tree");
                    collapse(intersects[0].object);
                }
            }
        }
    }
}

function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {
        modalContent.innerHTML = intersects[0].object['name'] + '<br/>' + intersects[0].object['count'];
        modal.style.display = "block";
    }
    else{
        modal.style.display = "none";
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
        removeByAttr(lines, 'name', selectedLine.name);
        scene.remove(selectedLine);

        var selectedSprite = scene.getObjectByName("sprite " + selected.name);
        removeByAttr(sprites, 'name', selectedSprite.name);
        scene.remove(selectedSprite);
    }
    node['expanded'] = false;
    node['children'] = [];
}