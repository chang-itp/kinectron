// check for webgl
if (!Detector.webgl) Detector.addGetWebGLMessage();

// three.js environment
var camera, scene, renderer,
    bulbLight, bulbMat, ambientLight, hemiLight,
    object, loader, stats;

// materials for globes
var ballMat; //ballMat2, ballMat3, ballMat4;

// globes
var ballMesh; //ballMesh2, ballMesh3;

// lines for skeleton
var line, line1, line2, line3;

var previousShadowMap = false;

// ref for lumens: http://www.power-sure.com/lumens.htm
var bulbLuminousPowers = {
    "110000 lm (1000W)": 110000,
    "3500 lm (300W)": 3500,
    "1700 lm (100W)": 1700,
    "800 lm (60W)": 800,
    "400 lm (40W)": 400,
    "180 lm (25W)": 180,
    "20 lm (4W)": 20,
    "Off": 0
};

// ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
var hemiLuminousIrradiances = {
    "0.0001 lx (Moonless Night)": 0.0001,
    "0.002 lx (Night Airglow)": 0.002,
    "0.5 lx (Full Moon)": 0.5,
    "3.4 lx (City Twilight)": 3.4,
    "50 lx (Living Room)": 50,
    "100 lx (Very Overcast)": 100,
    "350 lx (Office Room)": 350,
    "400 lx (Sunrise/Sunset)": 400,
    "1000 lx (Overcast)": 1000,
    "18000 lx (Daylight)": 18000,
    "50000 lx (Direct Sun)": 50000
};

var params = {
    shadows: true,
    exposure: 0.68,
    bulbPower: Object.keys(bulbLuminousPowers)[4],
    hemiIrradiance: Object.keys(hemiLuminousIrradiances)[0]
};
//var didDisapear;
init();
animate();

function init() {
    didDisapear = false;
    initEnvironment();
    initSpheres();
    initSkeleton();
    initKinectron();



    window.addEventListener('resize', onWindowResize, false);
}

function initEnvironment() {

    var container = document.getElementById('container');

    // add performance stats to page
    stats = new Stats();
    container.appendChild(stats.dom);

    // three.js camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.x = -4;
    camera.position.z = 4;
    camera.position.y = 2;

    // create three.js scene
    scene = new THREE.Scene();

    // create light bulb
    var bulbGeometry = new THREE.SphereGeometry(0.05, 16, 8);
    bulbLight = new THREE.PointLight(0xffee88, 1, 100, 2);

    bulbMat = new THREE.MeshStandardMaterial({
        emissive: 0xffffee,
        emissiveIntensity: 1,
        color: 0x000000
    });

    bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
    bulbLight.position.set(0, 2, 0);
    bulbLight.castShadow = true;
    scene.add(bulbLight);

    // add hemispheric light
    hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.02);
    scene.add(hemiLight);

    // three.js renderer
    renderer = new THREE.WebGLRenderer();
    renderer.physicallyCorrectLights = true;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // add mouse/camera controls
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();
}

function initSpheres() {
    // create loader for earth textures
    var textureLoader = new THREE.TextureLoader();

    // ball mat 1
    ballMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 1.0,
        transparent: true
    });


    textureLoader.load("../shared/textures/earth_atmos_2048.jpg", function(map) {
        map.anisotropy = 4;
        ballMat.map = map;
        ballMat.needsUpdate = true;
    });
    textureLoader.load("../shared/textures/earth_specular_2048.jpg", function(map) {
        map.anisotropy = 4;
        ballMat.metalnessMap = map;
        ballMat.needsUpdate = true;
    });
    ballMat.needsUpdate = true;

    // create ball 1
    var ballGeometry = new THREE.SphereGeometry(0.65, 40, 32);


    ballMesh = new THREE.Mesh(ballGeometry, ballMat);
    ballMesh.position.set(1, 0.5, 1);
    ballMesh.rotation.y = Math.PI;
    ballMesh.castShadow = true;
    scene.add(ballMesh);

}

function initSkeleton() {
    var materialLine = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 3
    });
}

function initKinectron() {
    // Define and create an instance of kinectron
    var kinectronIpAddress = "172.16.226.135"; // FILL IN YOUR KINECTRON IP ADDRESS HERE
    kinectron = new Kinectron(kinectronIpAddress);

    // Connect to the microstudio
    //kinectron = new Kinectron("kinectron.itp.tsoa.nyu.edu");

    // Create connection between remote and application
    kinectron.makeConnection();

    // Start tracked bodies and set callback
    kinectron.startTrackedBodies(drawJoints);
}


function drawJoints(data) {

    // update position of light on right hand

    bulbLight.position.x = data.joints[kinectron.HANDRIGHT].cameraX;
    bulbLight.position.y = data.joints[kinectron.HANDRIGHT].cameraY;
    bulbLight.position.z = data.joints[kinectron.HANDRIGHT].cameraZ;
}

function onWindowResize() {

    // resize camera on window rewize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function animate() {

    requestAnimationFrame(animate);
    render();

}



function render() {
    var posBall = ballMesh.position;
    var posJoint = bulbLight.position;
    var d = posBall.distanceTo(posJoint);
    console.log(d);

    if (d < 0.8) {

        if (ballMesh.material.opacity < 0.01 && didDisapear == false) {
            didDisapear = true;
            ballMesh.material.opacity = 0;
            ballMesh.position.x = -ballMesh.position.x;
            ballMesh.position.y = -ballMesh.position.y;
            ballMesh.position.z = -ballMesh.position.z;
            console.log(opacity);
        } else {
            ballMesh.material.opacity -= 0.01;
        }
    } else {

        if (ballMesh.material.opacity > 0.9) {
            ballMesh.material.opacity = 1;

        } else {
            ballMesh.material.opacity += 0.01;
        }

    };

    // to allow for very bright scenes.
    renderer.toneMappingExposure = Math.pow(params.exposure, 5.0);

    // update shadows
    renderer.shadowMap.enabled = params.shadows;
    bulbLight.castShadow = params.shadows;

    if (params.shadows !== previousShadowMap) {
        previousShadowMap = params.shadows;
    }

    // set light power
    bulbLight.power = bulbLuminousPowers[params.bulbPower];
    bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow(0.02, 2.0); // convert from intensity to irradiance at bulb surface
    hemiLight.intensity = hemiLuminousIrradiances[params.hemiIrradiance];

    // rotate globes
    ballMesh.rotation.y += 0.005;

    // render scene
    renderer.render(scene, camera);

    // keep stats up to date
    stats.update();

}
