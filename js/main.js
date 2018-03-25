var scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(150, 400, 350);
camera.lookAt(new THREE.Vector3(0, 0, 0));
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var basePosition = new THREE.Vector3(0, 30, 0);
// The basic radius for the deepest level
var baseRadius = 20;
// Distance between 2 levels of the tree
var levelShift = 30;

init();
animate();

function init() {
    var light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(200, 200, 200);
    light.castShadow = true;
    scene.add(light);

    var sphereGeometry = new THREE.SphereBufferGeometry(5, 32, 32);
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    sphere.position.set(basePosition.x, basePosition.y, basePosition.z);
    scene.add(sphere);

    var depth = 5;
    var count = 4;
    var radiusArray = computeRadius(depth, count);
    generateConeTree(radiusArray, depth, count, sphere.position);

    // var planeGeometry = new THREE.PlaneBufferGeometry( 200, 200, 32, 32 );
    // var planeMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00 } )
    // var plane = new THREE.Mesh( planeGeometry, planeMaterial );
    // plane.receiveShadow = true;
    // scene.add( plane );

    // var helper = new THREE.CameraHelper( light.shadow.camera );
    // scene.add( helper );
}

function animate() {
    requestAnimationFrame( animate );

    renderer.render( scene, camera );
}

function generateConeTree(radiusArray, depth, count, parentPosition) {
    var baseAngle = 2 * Math.PI / count;
    var sphereGeometry = new THREE.SphereBufferGeometry(5, 32, 32);
    var sphereMaterial = new THREE.MeshPhongMaterial({color: 0xff0000});
    var lineMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    var angle = baseAngle;
    var radius = radiusArray[depth - 1];
    for(var i = 0; i < count; i++){
        var x = radius * Math.cos(angle) + parentPosition.x;
        var z = radius * Math.sin(angle) + parentPosition.z;
        angle += baseAngle;
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
            generateConeTree(radiusArray, depth - 1, count, sphere.position);
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



















