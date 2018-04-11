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
//Raycaster for clickable objects
// var objects = [];
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
document.addEventListener( 'mousedown', onDocumentMouseDown, false );
document.addEventListener( 'touchstart', onDocumentTouchStart, false );
document.addEventListener( 'mousemove', onDocumentMouseMove, false );

// The base position of the root node
var basePosition = new THREE.Vector3(0, 200, 0);
// The basic radius for the deepest level
var baseRadius = 200;
// Distance between 2 levels of the tree
var levelShift = 2000;
var delimiter = 150;
var dataset;
//deprecated
var levels = ["Workclass", "Education", "Marital_status", "Occupation", "Relationship",
    "Race", "Sex", "Hours_per_week", "Native_country", "Age"];
var hierarchy = [];

$.when(csvAjax()).then(init);

//functions
function onDocumentTouchStart( event ) {
    event.preventDefault();
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseDown( event );
}

function onDocumentMouseDown( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {
        intersects[0].object.material.color.setHex( Math.random() * 0xffffff );
        // var particle = new THREE.Sprite( particleMaterial );
        // particle.position.copy( intersects[ 0 ].point );
        // particle.scale.x = particle.scale.y = 16;
        // scene.add( particle );
    }
    /*
    // Parse all the faces
    for ( var i in intersects ) {
        intersects[ i ].face.material[ 0 ].color.setHex( Math.random() * 0xffffff | 0x80000000 );
    }
    */
}

function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    // Get the modal
    var modal = document.getElementById('myModal');
    var modalContent = document.getElementById('myModalContent');
    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {
        modalContent.innerHTML = intersects[0].object['name'];
        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
            modal.style.display = "none";
        };
        modal.style.display = "block";
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        }
    }
    else{
        modal.style.display = "none";
    }
}

function init() {
    var counts = {};
    counts = getCountsFromDataset(counts, 0);
    // for (var item in counts[levels[0]]){
    //     hierarchy.push(item);
    //     counts[levels[0]][item] = getCountsFromDataset(counts[levels[0]][item], 1);
    //     for(var item2 in counts[levels[0]][item][levels[1]]){
    //         hierarchy.push(item2);
    //         counts[levels[0]][item][levels[1]][item2] = getCountsFromDataset(counts[levels[0]][item][levels[1]][item2], 2);
    //         hierarchy.pop(item2);
    //     }
    //     hierarchy.pop(item);
    // }

    var light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(19000, 16000, 19000);
    light.castShadow = true;
    scene.add(light);

    var sphereGeometry = new THREE.SphereBufferGeometry(dataset.length / delimiter, 32, 32);
    //var sphereGeometry = new THREE.SphereBufferGeometry(20, 32, 32);
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    sphere.position.set(basePosition.x, basePosition.y, basePosition.z);
    sphere['count'] = dataset.length;
    sphere['name'] = "Adults - all records";
    scene.add(sphere);
    // objects.push(sphere);

    var depth = 3;
    var count = Object.keys(counts).length - 1;
    //var count = 5;
    var radiusArray = computeRadius(depth, count);
    generateConeTree(radiusArray, depth, sphere.position, counts);

    // var planeGeometry = new THREE.PlaneBufferGeometry( 200, 200, 32, 32 );
    // var planeMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00 } )
    // var plane = new THREE.Mesh( planeGeometry, planeMaterial );
    // plane.receiveShadow = true;
    // scene.add( plane );

    // var helper = new THREE.CameraHelper( light.shadow.camera );
    // scene.add( helper );

    // createMenu();

    animate();
}

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

function generateConeTree(radiusArray, depth, parentPosition, json) {
    var baseAngle = 2 * Math.PI / (Object.keys(json).length - 1);
    var angle = baseAngle;
    var radius = radiusArray[depth - 1];
    for(var obj in json){
    //for(var i = 0; i < Object.keys(json).length; i++){
        if (obj !== 'count') {
            var x = radius * Math.cos(angle) + parentPosition.x;
            var z = radius * Math.sin(angle) + parentPosition.z;
            angle += baseAngle;
            var sphereGeometry = new THREE.SphereBufferGeometry(json[obj]['count'] / delimiter, 32, 32);
            //var sphereGeometry = new THREE.SphereBufferGeometry(20, 32, 32);
            var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
            var lineMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff } );
            var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.castShadow = true;
            sphere.receiveShadow = false;
            sphere.position.set(x, parentPosition.y - levelShift, z);
            scene.add(sphere);
            // objects.push(sphere);
            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(parentPosition);
            lineGeometry.vertices.push(sphere.position);
            var line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(line);
            if (depth > 1) {
                generateConeTree(radiusArray, depth - 1, sphere.position, json[obj]);
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
    var obj = {
        message: 'Hello World',
        displayOutline: false,
        maxSize: 6.0,
        speed: 5,
        height: 10,
        noiseStrength: 10.2,
        growthSpeed: 0.2,
        type: 'three',
        explode: function () {
            alert('Bang!');
        },
        color0: "#ffae23", // CSS string
        color1: [ 0, 128, 255 ], // RGB array
        color2: [ 0, 128, 255, 0.3 ], // RGB with alpha
        color3: { h: 350, s: 0.9, v: 0.3 } // Hue, saturation, value
    };

    var gui = new dat.gui.GUI();
    gui.add(obj, 'message');
    gui.add(obj, 'displayOutline');
    gui.add(obj, 'explode');

    gui.add(obj, 'maxSize').min(-10).max(10).step(0.25);
    gui.add(obj, 'height').step(5); // Increment amount
    // Choose from accepted values
    gui.add(obj, 'type', [ 'one', 'two', 'three' ] );
    // Choose from named values
    gui.add(obj, 'speed', { Stopped: 0, Slow: 0.1, Fast: 5 } );
}
















