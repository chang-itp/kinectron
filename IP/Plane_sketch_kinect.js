var Boid = function() {
    var vector = new THREE.Vector3(),
        _acceleration, _width = 500,
        _height = 500,
        _depth = 200,
        _goal, _neighborhoodRadius = 25,
        _maxSpeed = 4,
        _maxSteerForce = 0.1,
        _avoidWalls = false;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    _acceleration = new THREE.Vector3();
    this.setGoal = function(target) {
        _goal = target;
    };
    this.setAvoidWalls = function(value) {
        _avoidWalls = value;
    };
    this.setWorldSize = function(width, height, depth) {
        _width = width;
        _height = height;
        _depth = depth;
    };
    //draw the plane

    this.run = function(boids) {
        if (_avoidWalls) {
            vector.set(-_width, this.position.y, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);
            vector.set(_width, this.position.y, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);
            vector.set(this.position.x, -_height, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);
            vector.set(this.position.x, _height, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);
            vector.set(this.position.x, this.position.y, -_depth);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);
            vector.set(this.position.x, this.position.y, _depth);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            _acceleration.add(vector);
        }


        if (Math.random() > 0.5) {
            this.flock(boids);
        }
        this.move();
    };
    this.flock = function(boids) {
        if (_goal) {
            _acceleration.add(this.reach(_goal, 0.005));
        }
        _acceleration.add(this.alignment(boids));
        _acceleration.add(this.cohesion(boids));
        _acceleration.add(this.separation(boids));
    };
    this.move = function() {
        this.velocity.add(_acceleration);
        var l = this.velocity.length();
        if (l > _maxSpeed) {
            this.velocity.divideScalar(l / _maxSpeed);
        }
        this.position.add(this.velocity);
        _acceleration.set(0, 0, 0);
    };
    this.checkBounds = function() {
        if (this.position.x > _width) this.position.x = -_width;
        if (this.position.x < -_width) this.position.x = _width;
        if (this.position.y > _height) this.position.y = -_height;
        if (this.position.y < -_height) this.position.y = _height;
        if (this.position.z > _depth) this.position.z = -_depth;
        if (this.position.z < -_depth) this.position.z = _depth;
    };
    //
    this.avoid = function(target) {
        var steer = new THREE.Vector3();
        steer.copy(this.position);
        steer.sub(target);
        steer.multiplyScalar(1 / this.position.distanceToSquared(target));
        return steer;
    };
    this.repulse = function(target) {
        var distance = this.position.distanceTo(target);
        if (distance < 150) {
            var steer = new THREE.Vector3();
            steer.subVectors(this.position, target);
            steer.multiplyScalar(0.5 / distance);
            _acceleration.add(steer);
        }
    };
    this.reach = function(target, amount) {
        var steer = new THREE.Vector3();
        steer.subVectors(target, this.position);
        steer.multiplyScalar(amount);
        return steer;
    };
    this.alignment = function(boids) {
        var boid, velSum = new THREE.Vector3(),
            count = 0;
        for (var i = 0, il = boids.length; i < il; i++) {
            if (Math.random() > 0.6) continue;
            boid = boids[i];
            distance = boid.position.distanceTo(this.position);
            if (distance > 0 && distance <= _neighborhoodRadius) {
                velSum.add(boid.velocity);
                count++;
            }
        }
        if (count > 0) {
            velSum.divideScalar(count);
            var l = velSum.length();
            if (l > _maxSteerForce) {
                velSum.divideScalar(l / _maxSteerForce);
            }
        }
        return velSum;
    };
    this.cohesion = function(boids) {
        var boid, distance,
            posSum = new THREE.Vector3(),
            steer = new THREE.Vector3(),
            count = 0;
        for (var i = 0, il = boids.length; i < il; i++) {
            if (Math.random() > 0.6) continue;
            boid = boids[i];
            distance = boid.position.distanceTo(this.position);
            if (distance > 0 && distance <= _neighborhoodRadius) {
                posSum.add(boid.position);
                count++;
            }
        }
        if (count > 0) {
            posSum.divideScalar(count);
        }
        steer.subVectors(posSum, this.position);
        var l = steer.length();
        if (l > _maxSteerForce) {
            steer.divideScalar(l / _maxSteerForce);
        }
        return steer;
    };
    this.separation = function(boids) {
        var boid, distance,
            posSum = new THREE.Vector3(),
            repulse = new THREE.Vector3();
        for (var i = 0, il = boids.length; i < il; i++) {
            if (Math.random() > 0.6) continue;
            boid = boids[i];
            distance = boid.position.distanceTo(this.position);
            if (distance > 0 && distance <= _neighborhoodRadius) {
                repulse.subVectors(this.position, boid.position);
                repulse.normalize();
                repulse.divideScalar(distance);
                posSum.add(repulse);
            }
        }
        return posSum;
    }
}

var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,
    SCREEN_WIDTH_HALF = SCREEN_WIDTH / 2,
    SCREEN_HEIGHT_HALF = SCREEN_HEIGHT / 2;
var camera, scene, renderer, planes, plane;
var boid, boids;
var planeMat;
var posJoints;

init();
animate();

function init() {
    initSkeleton();
    initKinectron();
    window.addEventListener('resize', onWindowResize, false);

    camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000);
    camera.position.z = 450;
    scene = new THREE.Scene();


    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.5);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    var light = new THREE.DirectionalLight(0xefefff, 0.7);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    var light = new THREE.DirectionalLight(0xffefef, 1);
    light.position.set(-1, -1, -1).normalize();
    scene.add(light);


    planes = [];
    boids = [];


    planeMat = new THREE.MeshStandardMaterial({
        //color: Math.random()*0xCCCCFF,
        metalness: 0,
        emissive: 1,
        vertexColors: THREE.FaceColors,

        side: THREE.DoubleSide
    });



    for (var i = 0; i < 150; i++) {
        boid = boids[i] = new Boid();
        boid.position.x = Math.random() * 400 - 200;
        boid.position.y = Math.random() * 400 - 200;
        boid.position.z = Math.random() * 400 - 200;
        boid.velocity.x = Math.random() * 2 - 1;
        boid.velocity.y = Math.random() * 2 - 1;
        boid.velocity.z = Math.random() * 2 - 1;
        boid.setAvoidWalls(true);
        boid.setWorldSize(500, 500, 400);
        plane = planes[i] = new THREE.Mesh(new Plane(), planeMat);
        plane.geometry.scale(4, 4, 4);
        scene.add(plane);
    }


    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xFFFFFF, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.body.appendChild(renderer.domElement);
    //
    window.addEventListener('resize', onWindowResize, false);


}

function initKinectron() {
    // Define and create an instance of kinectron
    var kinectronIpAddress = "172.16.225.187"; // FILL IN YOUR KINECTRON IP ADDRESS HERE
    kinectron = new Kinectron(kinectronIpAddress);


    // Create connection between remote and application
    kinectron.makeConnection();

    // Start tracked bodies and set callback
    kinectron.startTrackedBodies(drawJoints);
}


function drawJoints(data) {

    // update position of light on right hand

    posJoints.position.x = data.joints[kinectron.HANDRIGHT].cameraX;
    posJoints.position.y = data.joints[kinectron.HANDRIGHT].cameraY;
    posJoints.position.z = data.joints[kinectron.HANDRIGHT].cameraZ;
}

function onWindowResize() {

    // resize camera on window rewize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}


function animate() {

    requestAnimationFrame(animate);
    render();

}

//move this to jointsposition

// function onDocumentMouseMove(event) {
//     var vector = new THREE.Vector3(event.clientX - SCREEN_WIDTH_HALF, -event.clientY + SCREEN_HEIGHT_HALF, 0);
//     for (var i = 0, il = boids.length; i < il; i++) {
//         boid = boids[i];
//         vector.z = boid.position.z;
//         boid.repulse(vector);
//     }
// }


function render() {
    var posJoints.position = new THREE.Vector3(event.clientX - SCREEN_WIDTH_HALF, -event.clientY + SCREEN_HEIGHT_HALF, 0);
    for (var i = 0, il = boids.length; i < il; i++) {
        boid = boids[i];
        posJoints.position.z = boid.position.z;
        boid.repulse(posJoints.position);
    }


    for (var i = 0, il = planes.length; i < il; i++) {
        boid = boids[i];
        boid.run(boids);
        plane = planes[i];
        plane.position.copy(boids[i].position);

        plane.rotation.y = Math.atan2(-boid.velocity.z, boid.velocity.x);
        plane.rotation.z = Math.asin(boid.velocity.y / boid.velocity.length());

    }
    renderer.render(scene, camera);
}
