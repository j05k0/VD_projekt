// Init of the scene
var scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);
// Init of the main camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(800, 800, 800);
camera.lookAt(new THREE.Vector3(0, -500, 0));
// Init of the renderer
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// The base position of the root node
var basePosition = new THREE.Vector3(0, 200, 0);
// The basic radius for the deepest level
var baseRadius = 200;
// Distance between 2 levels of the tree
var levelShift = 200;
var delimiter = 500;
var dataset;
//deprecated
var levels = ["Workclass", "Education", "Marital_status", "Occupation", "Relationship",
    "Race", "Sex", "Hours_per_week", "Native_country", "Age"];
var hierarchy = [];

$.when(csvAjax()).then(init);

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
    light.position.set(900, 600, 900);
    light.castShadow = true;
    scene.add(light);

    //var sphereGeometry = new THREE.SphereBufferGeometry(dataset.length / delimiter, 32, 32);
    var sphereGeometry = new THREE.SphereBufferGeometry(20, 32, 32);
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    sphere.position.set(basePosition.x, basePosition.y, basePosition.z);
    scene.add(sphere);

    var depth = 2;
    var count = Object.keys(counts).length;
    //var count = 5;
    var radiusArray = computeRadius(depth, count, counts);
    generateConeTree(radiusArray, depth, count, sphere.position, counts);

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

function generateConeTree(radiusArray, depth, count, parentPosition, counts) {
    var baseAngle = 2 * Math.PI / count;
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    var lineMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    var angle = baseAngle;
    var radius = radiusArray[depth - 1];
    //for(var obj in counts["Workclass"]){
    for(var i = 0; i < count; i++){
        var x = radius * Math.cos(angle) + parentPosition.x;
        var z = radius * Math.sin(angle) + parentPosition.z;
        angle += baseAngle;
        //var sphereGeometry = new THREE.SphereBufferGeometry(counts["Workclass"][obj] / delimiter, 32, 32);
        var sphereGeometry = new THREE.SphereBufferGeometry(20, 32, 32);
        var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.castShadow = true;
        sphere.receiveShadow = false;
        sphere.position.set(x, parentPosition.y - levelShift, z);
        scene.add(sphere);
        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(parentPosition);
        lineGeometry.vertices.push(sphere.position);
        var line = new THREE.Line( lineGeometry, lineMaterial );
        scene.add(line);
        if(depth > 1) {
            generateConeTree(radiusArray, depth - 1, count, sphere.position, counts);
        }
    }
}

function computeRadius(depth, count, counts){
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
    json = {};
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
















