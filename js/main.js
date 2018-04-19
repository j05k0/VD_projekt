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

//Controls for moving of camera
var controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.panningMode = THREE.HorizontalPanning;

var render = true;

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
// document.addEventListener( 'mousedown', onDocumentMouseDown, false );
// document.addEventListener( 'touchstart', onDocumentTouchStart, false );
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
var nodes = [];

createMenu();
$.when(csvAjax()).then(init);

function init() {
    var counts = {};
    counts = getCountsFromDataset(counts, 0);

    var light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(19000, 16000, 19000);
    light.castShadow = true;
    scene.add(light);
    light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(-19000, 16000, -19000);
    light.castShadow = true;
    scene.add(light);

    var sphereGeometry = new THREE.SphereBufferGeometry(dataset.length / delimiter, 32, 32);
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    sphere.position.set(basePosition.x, basePosition.y, basePosition.z);
    sphere['count'] = dataset.length;
    sphere['name'] = "Adults - all records";
    scene.add(sphere);
    nodes.push(sphere);
    var spritey = makeTextSprite(" " + sphere['name'] + " ", { fontsize: 25, backgroundColor: {r:255, g:100, b:100, a:0.75} } );
    spritey.position.set(basePosition.x + 50, basePosition.y + sphere.geometry.parameters.radius, basePosition.z);
    scene.add( spritey );

    var depth = 2;
    var count = Object.keys(counts).length - 1;
    var radiusArray = computeRadius(depth, count);
    var text = "Adults";
    generateConeTree(radiusArray, depth, sphere.position, counts, text);

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
    // if(render) {
    //     for (var obj in scene.children) {
    //         var object = scene.getObjectById(parseInt(obj));
    //         if(object.name != ''){
    //             console.log(object);
    //         }
    //
    //     }
    //     render = false;
    // }
    renderer.render( scene, camera );
}

function generateConeTree(radiusArray, depth, parentPosition, json, text) {
    var baseAngle = 2 * Math.PI / (Object.keys(json).length - 1);
    var angle = baseAngle;
    var radius = radiusArray[depth - 1];
    for(var obj in json){
    //for(var i = 0; i < Object.keys(json).length; i++){
        if (obj !== 'count') {
            var desc = text + " - " + obj;
            var x = radius * Math.cos(angle) + parentPosition.x;
            var z = radius * Math.sin(angle) + parentPosition.z;
            var spriteRadius = radius + 50;
            var spriteX = spriteRadius * Math.cos(angle) + parentPosition.x;
            var spriteZ = spriteRadius * Math.sin(angle) + parentPosition.z;
            angle += baseAngle;
            var sphereRadius = json[obj]['count'] / delimiter;
            if(sphereRadius < 50){
                sphereRadius =  50;
            }
            var sphereGeometry = new THREE.SphereBufferGeometry(sphereRadius, 32, 32);
            var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
            var lineMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff } );
            var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.castShadow = true;
            sphere.receiveShadow = false;
            sphere.position.set(x, parentPosition.y - levelShift, z);
            sphere['count'] = json[obj]['count'];
            sphere['name'] = desc;
            scene.add(sphere);
            nodes.push(sphere);
            var spritey = makeTextSprite(" " + obj + " ", { fontsize: 25, backgroundColor: {r:255, g:100, b:100, a:0.75} } );
            spritey.position.set(spriteX, sphere.position.y, spriteZ);
            scene.add( spritey );
            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(parentPosition);
            lineGeometry.vertices.push(sphere.position);
            var line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(line);
            if (depth > 1) {
                generateConeTree(radiusArray, depth - 1, sphere.position, json[obj], desc);
            }
        }
    }
}

function computeRadius(depth, count){
    var radiusArray = [];
    var baseAngle = 2 * Math.PI / count / 2;
    var radius = baseRadius;
    radiusArray[0] = baseRadius;
    for(var i = 1; i < depth; i++){
        var x = (radius * 2 + radius) / 2 / Math.sin(baseAngle);
        radiusArray[i] = x;
        radius = x;
    }
    return radiusArray;
}

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
        json[dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id++]]][dataset[i][levels[id]]]['count']++;

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
            levels = [];
            nodes = [];
            for(var i = 0; i < 10; i++){
                levels.push(this[(i + 1 ) + ". layer"]);
            }
            scene =  new THREE.Scene();
            scene.background = new THREE.Color(0xcccccc);
            init();
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
    var controlCount = filterFolder.add(filter, "Max count").name('Max count');
    controlCount.onChange(function () {
        for (var i = 0; i < nodes.length; i++){
            nodes[i].material.color.setHex(0xff0000);
        }
        for (i = 0; i < nodes.length; i++){
            if(nodes[i]['count'] > filter["Max count"]){
                nodes[i].material.color.setHex(0x0000ff);
            }
        }
    })
}

function makeTextSprite( message, parameters )
{
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
function roundRect(ctx, x, y, w, h, r)
{
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

//Listener functions
function onDocumentTouchStart( event ) {
    //event.preventDefault();
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseDown( event );
}

function onDocumentMouseDown( event ) {
    //event.preventDefault();
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {
        intersects[0].object.material.color.setHex(0x0000ff);
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
