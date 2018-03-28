// Init of the scene
var scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);
// Init of the main camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(200, 400, 400);
camera.lookAt(new THREE.Vector3(0, 0, 0));
// Init of the renderer
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// The base position of the root node
var basePosition = new THREE.Vector3(0, 300, 0);
// The basic radius for the deepest level
var baseRadius = 20;
// Distance between 2 levels of the tree
var levelShift = 200;
var delimiter = 500;
var dataset;
$.when(csvAjax()).then(init);

function init() {
    console.log("Let's print your first dataset in JS.");

    var counts = getCountsFromDataset();

    var light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(500, 200, 500);
    light.castShadow = true;
    scene.add(light);

    //var sphereGeometry = new THREE.SphereBufferGeometry(dataset.length / delimiter, 32, 32);
    var sphereGeometry = new THREE.SphereBufferGeometry(5, 32, 32);
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    sphere.position.set(basePosition.x, basePosition.y, basePosition.z);
    scene.add(sphere);

    var depth = 3;
    var count = Object.keys(counts["Workclass"]).length;
    var radiusArray = computeRadius(depth, count, counts);
    generateConeTree(radiusArray, depth, count, sphere.position, counts);

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

function generateConeTree(radiusArray, depth, count, parentPosition, counts) {
    var baseAngle = 2 * Math.PI / count;
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    var lineMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    var angle = baseAngle;
    var radius = radiusArray[depth - 1];
    for(var obj in counts["Workclass"]){
        var x = radius * Math.cos(angle) + parentPosition.x;
        var z = radius * Math.sin(angle) + parentPosition.z;
        angle += baseAngle;
        //var sphereGeometry = new THREE.SphereBufferGeometry(counts["Workclass"][obj] / delimiter, 32, 32);
        var sphereGeometry = new THREE.SphereBufferGeometry(5, 32, 32);
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

//TODO add another columns
function getCountsFromDataset() {
    var json = {"Workclass": {}};
    for(var i = 0; i < dataset.length; i++){
        if (json["Workclass"][dataset[i].Workclass] == null){
            json["Workclass"][dataset[i].Workclass] = 0;
        }
        json["Workclass"][dataset[i].Workclass]++;
    }
    console.log(json);
    console.log(JSON.stringify(json));
    return json;
}


















