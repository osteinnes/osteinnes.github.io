
var scene, camera, controls, renderer, sunLight;
var sunAnimateCheck, cameraHelperCheck, checkShowSkyExposure;
var canvas, canvasPosition, rayCaster, mousePosition, myObjects, currentObjId, currentLandmark;
var data;
var fileInput
var iObjects = [];
var textures = ["tex1.jpg","tex2.jpg","tex3.jpg","tex4.jpg"];
var boxHelper;
var landmarkPool = [];

var width = window.innerWidth,
    height = window.innerHeight;


    
initApplication();


resize();
renderer.render( scene, camera );
window.addEventListener('resize',resize);

addListeners();
renderer.domElement.addEventListener('click', onDocumentMouseDown, false);
animate();

/**
 * Check for the various File API support.
 */
function checkFileAPI() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        reader = new FileReader();
        return true; 
    } else {
        alert('The File APIs are not fully supported by your browser. Fallback required.');
        return false;
    }
}

/**
 * read text input
 */
function readText() {
    filePath = fileInput;
    var output = ""; //placeholder for text output
    
    if(filePath.files && filePath.files[0]) {           
        reader.onload = function (e) {
            output = e.target.result;
            console.log(output);
        };//end onload()
        reader.readAsText(filePath.files[0]);
        
    }//end if html5 filelist support
    
    else { //this is where you could fallback to Java Applet, Flash or similar
        return false;
    }       
    return true;
}   

function exportScene(){
    // Instantiate a exporter
    var exporter = new THREE.GLTFExporter();

    var options = {
        trs: false,
        onlyVisible: true,
        truncateDrawRange: true,
        binary: true,
        forceIndices: false,
        forcePowerOfTwoTextures: false,
        embedImages: true,
    };

    // Parse the input and generate the glTF output
    exporter.parse( scene, function ( result ) {
        if ( result instanceof ArrayBuffer ) {
            saveArrayBuffer( result, 'scene.glb' );
        } else {
            var output = JSON.stringify( result, null, 2 );
            console.log( output );
            saveString( output, 'scene.gltf' );
        }
    }, options);
}

var link = document.createElement( 'a' );
link.style.display = 'none';

function save( blob, filename ) {
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}

function saveString( text, filename ) {

    save( new Blob( [ text ], { type: 'text/plain' } ), filename );

}

function saveArrayBuffer( buffer, filename ) {

    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );

}

function addSun() {

}

function loadModel(location){
    var gloader = new THREE.GLTFLoader();

    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    var str = 'assets/loadable_scenes/loadable_scenes/nice-france.glb';
    if (location == "Kragero"){
        str = 'assets/loadable_scenes/loadable_scenes/kragro_map2.glb';
    } else if (location == "Nice"){
        str = 'assets/loadable_scenes/loadable_scenes/nice-france.glb';
    }

    // Load a glTF resource
    gloader.load(
        // resource URL
        str,
        // called when the resource is loaded
        function ( gltf ) {

            // Add the result to the scene.
            console.log(scene);
            scene.add(gltf.scene);
            console.log("scene after: ",scene.children);

            myObjects = scene.getObjectByName("MyObj");
            myBuildings = myObjects.getObjectByName("MyBuildings");
            myArrows = new THREE.Object3D();
            myArrows.name = "MyArr";
            scene.add(myArrows);
            lightIntensityBars = new THREE.Object3D();
            lightIntensityBars.name = "lightIntensityBars";
            scene.add(lightIntensityBars);

            createSun();
            var ambient = new THREE.AmbientLight(0xeeeeee, 0.3);
            scene.add(ambient);
            

        },
        // called while loading is progressing
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );

}

function initApplication(){
    createRenderer();
    createScene();
    myObjects = new THREE.Object3D();
    myArrows = new THREE.Object3D();
    myBuildings = new THREE.Object3D();
    lightIntensityBars = new THREE.Object3D();

    myBuildings.name = "MyBuildings";
    myArrows.name = "MyArr";
    myObjects.name = "MyObj";
    lightIntensityBars.name = "lightIntensityBars";

    scene.add(lightIntensityBars);
    scene.add(myArrows);
    scene.add(myObjects);
    myObjects.add(myBuildings);



    rayCaster = new THREE.Raycaster();
    mousePosition = new THREE.Vector2();

    createCamera();
    createSun();
    //createLighting();
    setupControls();

    //newBuilding(0,0,0, 1, 0.1, 1, 'tex1.jpg');
    //newBuilding(0,0,0,0.1,1,1,'tex1.jpg');
    //newBuilding(0,0.05,0,3,1,1,'tex1.jpg');
    //createTerrain();
    //addAxisHelper();
    

    
    //loadModel();
    //loadBlenderTerrain();
}

function onDocumentMouseDown( event ) {
    event.preventDefault();
    var vector = new THREE.Vector3(
        ( event.clientX / window.innerWidth ) * 2 - 1,
      - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5
    );
    rayCaster.setFromCamera(vector, camera);
    var intersects = rayCaster.intersectObjects( myObjects.children ,true);
    console.log(scene.children);
    console.log("child: ", myObjects.children);
    console.log("intersects: ", intersects);
    if ( intersects.length > 0 ) {
        
        if (document.getElementById("checkPickSpots").checked){
            createLightIntensityBar(intersects[0].point.x,intersects[0].point.y,intersects[0].point.z);
        }

        

        document.getElementById("currentBuildingPosX").value = intersects[0].object.position.x; 
        document.getElementById("currentBuildingPosY").value = intersects[0].object.position.y; 
        document.getElementById("currentBuildingPosZ").value = intersects[0].object.position.z; 

        document.getElementById("newBuildingPosX").value = intersects[0].point.x;
        document.getElementById("newBuildingPosY").value = intersects[0].point.y;
        document.getElementById("newBuildingPosZ").value = intersects[0].point.z;

        document.getElementById("skyExposurePosX").value = intersects[0].point.x;
        document.getElementById("skyExposurePosY").value = intersects[0].point.y;
        document.getElementById("skyExposurePosZ").value = intersects[0].point.z;

        console.log(intersects);

        if (intersects[0].object.name != "terrain"){

            geo = intersects[0].object.geometry;
            geo.computeBoundingBox();

            // Remember current object ID
            currentObjId = intersects[0].object.id;
            if (!document.getElementById("checkAllBuildings").checked){
                intersects[0].object.material.opacity = 0.5;
                landmarkPool.push(intersects[0].object);
                console.log("Adding building to landmark pool: ", landmarkPool);
            }

            if(geo instanceof THREE.BufferGeometry) {

                document.getElementById("btnSetAsLandmark").innerHTML = "Set as landmark";
                document.getElementById("currentBuildingHeight").value = Math.abs(geo.boundingBox.min.x) + Math.abs(geo.boundingBox.max.x);
                document.getElementById("currentBuildingWidth").value = Math.abs(geo.boundingBox.min.y) + Math.abs(geo.boundingBox.max.y);
                document.getElementById("currentBuildingDepth").value = Math.abs(geo.boundingBox.min.z) + Math.abs(geo.boundingBox.max.z);

                document.getElementById("newBuildingHeight").value = Math.abs(geo.boundingBox.min.x) + Math.abs(geo.boundingBox.max.x);
                document.getElementById("newBuildingWidth").value = Math.abs(geo.boundingBox.min.y) + Math.abs(geo.boundingBox.max.y);
                document.getElementById("newBuildingDepth").value = Math.abs(geo.boundingBox.min.z) + Math.abs(geo.boundingBox.max.z);
            } else {

                document.getElementById("btnSetAsLandmark").innerHTML = "Set as landmark";

                document.getElementById("currentBuildingHeight").value = intersects[0].object.geometry.parameters.height;
                document.getElementById("currentBuildingWidth").value = intersects[0].object.geometry.parameters.width;
                document.getElementById("currentBuildingDepth").value = intersects[0].object.geometry.parameters.depth;

                document.getElementById("newBuildingHeight").value = intersects[0].object.geometry.parameters.height;
                document.getElementById("newBuildingWidth").value = intersects[0].object.geometry.parameters.width;
                document.getElementById("newBuildingDepth").value = intersects[0].object.geometry.parameters.depth;
            }
        } else {
            document.getElementById("btnSetAsLandmark").value = "";
        }

        
        
    }
}

function createLightIntensityBar(x, y, z){

    var material = new THREE.MeshStandardMaterial();
    material.color = new THREE.Color(0x0000ff);
    material.transparent = true;
    material.opacity = 0.5

    var h = 50;
    var w = 250;
    var d = 50;

    var geo = new THREE.CubeGeometry( h , w, d );
    var cube = new THREE.Mesh( geo, material );
    cube.receiveShadow=false;
    cube.castShadow=false;
    cube.position.set(x,y+125,z);
    cube.name = "lightIntensityBar";
    cube.geometry.computeBoundingBox();
    lightIntensityBars.add(cube);

    console.log("Bar created");

}

function renderLightBars(){
    for (var i=0;i<lightIntensityBars.children.length;i++){
        child = lightIntensityBars.children[i].clone();
        
        var width = child.geometry.parameters.width;
        var height = child.geometry.parameters.height;
        var depth = child.geometry.parameters.depth;

        var x = child.position.x;
        var y = child.position.y;
        var z = child.position.z;

        var min = child.geometry.boundingBox.min;
        var max = child.geometry.boundingBox.max;

        console.log("width: ", width);

        p1=new THREE.Vector3(child.position.x + width/2, child.position.y + height/2, child.position.z + depth/2);
        p2=new THREE.Vector3(child.position.x + width/2, child.position.y + height/2, child.position.z - depth/2);
        p3=new THREE.Vector3(child.position.x + width/2, child.position.y - height/2, child.position.z + depth/2);
        p4=new THREE.Vector3(child.position.x + width/2, child.position.y - height/2, child.position.z - depth/2);
        p5=new THREE.Vector3(child.position.x - width/2, child.position.y + height/2, child.position.z + depth/2);
        p6=new THREE.Vector3(child.position.x - width/2, child.position.y + height/2, child.position.z - depth/2);
        p7=new THREE.Vector3(child.position.x - width/2, child.position.y - height/2, child.position.z + depth/2);
        p8=new THREE.Vector3(child.position.x - width/2, child.position.y - height/2, child.position.z - depth/2);

        points = [p7,p8,p3,p4];

        var numBlocks=0;

        for (var j=0; j<points.length;j++){
            var direction = new THREE.Vector3();
            var ray = new THREE.Raycaster(points[j], direction.subVectors(sunLight.position, points[j]).normalize());
            var results = ray.intersectObjects(myObjects.children, true);
            if (results.length>0){
                numBlocks++;
                if(document.getElementById("checkLightIntensityRay").checked){
                    drawArrow(direction.subVectors(sunLight.position, points[j]).normalize(), points[j], results[0].distance);
                }
            }
        }

        var intensity = points.length - numBlocks;

        var colors = [0x1f137c, 0x132f7c, 0x136e7c, 0x137c3b, 0xb7b91d];
        var heights = [70,80,90,100,110];


        if (heights[intensity] != height){
            
            var material = new THREE.MeshStandardMaterial();
            material.color = new THREE.Color(colors[intensity]);
            material.transparent = true;
            material.opacity = 0.5
            
            var w = 50;
            var d = 50;

            var geo = new THREE.CubeGeometry( w, heights[intensity], d );
            var cube = new THREE.Mesh( geo, material );

            cube.receiveShadow=false;
            cube.castShadow=false;

            var diff = height - heights[intensity];

            cube.position.set(x,y-(diff/2),z);

            cube.name = "lightIntensityBar";

            cube.lightBarHeight = heights[intensity];
            cube.lightBarWidth = w;
            cube.lightBarDepth = d;

            cube.geometry.computeBoundingBox();

            lightIntensityBars.add(cube);

            lightIntensityBars.remove(lightIntensityBars.children[i]);
        }




    }
}

function createRenderer(){
    // Create a renderer and add it to the DOM.
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMapping;
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);
}

function createScene(){
    // Create the scene 
    scene = new THREE.Scene();
}

function createCamera(){
    // Create a camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 20000);
    camera.position.z = 50;
    scene.add(camera);
}

function createLighting(){
    // Create a light, set its position, and add it to the scene.
    var light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(0,400,300);
    light.castShadow = true;

    light.shadow.mapSize.width = 200000*65536;
    light.shadow.mapSize.height = 200000*65536; 
    light.shadow.camera.top = -1000;
    light.shadow.camera.bottom = 1000;
    light.shadow.camera.left = -1000;
    light.shadow.camera.right = 1000;
    light.shadow.camera.far = 1500;
    light.shadow.bias = -0.0005;

    scene.add(light);
    var ambient = new THREE.AmbientLight(0xeeeeee, 0.03);
    scene.add(ambient);

    var helper = new THREE.CameraHelper( light.shadow.camera );
    scene.add(helper);
}

function setupControls(){
    // Add OrbitControls so that we can pan around with the mouse.
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableKeys = true;
}

function createTerrain(){
    var terrainLoader = new THREE.TerrainLoader();
    terrainLoader.load("../assets/hellesylt_test.bin", function(data) {
        //onsole.log(data);
        //var height = Math.round(value/65535*1480);

        var scale = 3;
        var geometry = new THREE.PlaneGeometry(scale*136,scale*109,1360, 1090);

        for (var i = 0, l = geometry.vertices.length; i < l; i++) {
            geometry.vertices[i].z = data[i] / 65535*80;
        }
        var material = new THREE.MeshStandardMaterial({
        map: THREE.ImageUtils.loadTexture('../assets/hellesylt_terrain5.jpg')
        });
        
        var plane = new THREE.Mesh(geometry, material);

        plane.castShadow = true;
        plane.receiveShadow = true;

        plane.rotation.x = -Math.PI/2;

        plane.name = "terrain";

        myObjects.add(plane)

        createSeabed(scale*136,scale*109);

        
    });
    
}

function createSun(){
    sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.castShadow = true;
    sunLight.shadowCameraVisible = true;
    sunLight.shadowCameraNear = 100;
    sunLight.shadowCameraFar = 7500;
    sunLight.shadowCameraLeft = -3500; // CHANGED
    sunLight.shadowCameraRight = 3500; // CHANGED
    sunLight.shadowCameraTop = 3500; // CHANGED
    sunLight.shadowCameraBottom = -3500; // CHANGED
    sunLight.shadow.bias = 0.0038;
    sunLight.shadowMapWidth = 4096;
    sunLight.shadowMapHeight = 4096;

    sunLight.position.set(20, 300, 400); // CHANGED
    scene.add(sunLight);
    
}

function rotateSun(incl){

    incl = incl/100;
    var distance = 4000;

    theta = Math.PI * ( incl );
    phi = 2 * Math.PI * ( incl );

    sunLight.position.x = distance * Math.cos( phi );
    sunLight.position.y = distance * Math.sin( phi ) * Math.sin( theta );
    sunLight.position.z = distance * Math.sin( phi ) * Math.cos( theta );
}

function createSeabed(x, y){
    var geometry = new THREE.PlaneGeometry( x, y );
    var material = new THREE.MeshBasicMaterial( {color: 0x03254c, side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( geometry, material );
    plane.position.y = 4;
    plane.rotation.x = Math.PI/2;
    scene.add( plane );
}

function addListeners(){
    document.getElementById("btnAnimate").onclick = function(){animate()};
    doHandleBuildingListeners();
    doHandleSaveLoad();
    doHandleSunControlListeners();
    doHandleSkyExposureListener();
    doHandleLandmark();
    doHandleLightIntensity();
    doHandleAdditionOfBuildings();
}

function doHandleAdditionOfBuildings(){
    document.getElementById("btnAddBuilding1").onclick = function(){
        addBuildingFromGlb('./assets/buildings/city3.glb');
    }
    document.getElementById("btnAddBuilding2").onclick = function(){
        addCottageHouse();
    }
    document.getElementById("btnAddBuilding3").onclick = function(){
        addOldHouse();
    }
    document.getElementById("btnAddBuilding4").onclick = function(){
        addHouseFour();
    }
    document.getElementById("btnAddBuilding5").onclick = function(){
        addHouseFifteen();
    }
    document.getElementById("btnAddBuilding6").onclick = function(){
        addHouseFifteentwo();
    }

}

function addHouseFifteen(){

    var textureLoader2 = new THREE.TextureLoader();
    var map2 = textureLoader2.load('./assets/2659421.jpg');
    var material6 = new THREE.MeshPhongMaterial({map: map2});

    var loader6 = new THREE.OBJLoader();

    loader6.load(
        // resource URL
        'assets/house15.obj',
        // called when resource is loadeds
        function ( object ) {

            object.traverse( function ( node ) {
                if ( node.isMesh ) {
                    node.material = material6;
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            var x =document.getElementById("newBuildingPosX").value;
            var z = document.getElementById("newBuildingPosZ").value;
            var w = +(document.getElementById("newBuildingWidth").value)
            var y = +(document.getElementById("newBuildingPosY").value)
            var ny = y + (w/2);
            object.rotation.y = Math.PI;
            object.position.set(x,ny,z);
            object.scale.set(0.04,0.04,0.04);
            object.castShadow = true;
            object.type = "Mesh";
            myBuildings.add( object );

        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );
}

function addHouseFifteentwo(){

    var textureLoader8 = new THREE.TextureLoader();
    var map8 = textureLoader8.load('./assets/tex_besi_2.jpg');
    var material8 = new THREE.MeshPhongMaterial({map: map8});

    var loader5 = new THREE.OBJLoader();


    loader5.load(
        // resource URL
        'assets/building.obj',
        // called when resource is loadeds
        function ( object ) {

            object.traverse( function ( node ) {
                if ( node.isMesh ) {
                    node.material = material8;
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            var x =document.getElementById("newBuildingPosX").value;
            var z = document.getElementById("newBuildingPosZ").value;
            var w = +(document.getElementById("newBuildingWidth").value)
            var y = +(document.getElementById("newBuildingPosY").value)
            var ny = y + (w/2);

            object.position.set(x,ny,z);
            object.scale.set(6,6,6);
            object.castShadow = true;
            object.type = "Mesh";
            
            myBuildings.add(object);


        },
        // called when loading is in progresses
        function ( xhr ) {

            //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );
}

function addHouseFour() {
    var textureLoader2 = new THREE.TextureLoader();
    var map2 = textureLoader2.load('./assets/2854440.jpg');
    var material6 = new THREE.MeshPhongMaterial({map: map2});

    var loader6 = new THREE.OBJLoader();

    loader6.load(
        // resource URL
        'assets/building_04.obj',
        // called when resource is loadeds
        function ( object ) {

            object.traverse( function ( node ) {
                if ( node.isMesh ) {
                    node.material = material6;
                    node.castShadow = true;
                    node.receiveShadow = false;
                }
            });
            var x =document.getElementById("newBuildingPosX").value;
            var z = document.getElementById("newBuildingPosZ").value;
            var w = +(document.getElementById("newBuildingWidth").value)
            var y = +(document.getElementById("newBuildingPosY").value)
            var ny = y + (w/2);

            object.position.set(x,ny,z);
            object.scale.set(2.7,2.7,2.7);
            object.castShadow = true;
            object.type = "Mesh";
            myBuildings.add( object );

        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );
}

function addOldHouse(){
    var textureLoader2 = new THREE.TextureLoader();
    var map2 = textureLoader2.load('./assets/oldHouse.jpg');
    var material4 = new THREE.MeshPhongMaterial({map: map2});

    var loader4 = new THREE.OBJLoader();



    loader4.load(
        // resource URL
        'assets/oldHouse.obj',
        // called when resource is loaded
        function ( object ) {

            object.traverse( function ( node ) {
                if ( node.isMesh ) {
                    node.material = material4;
                    node.castShadow = true;
                    node.receiveShadow = false;
                }
            });
            var x =document.getElementById("newBuildingPosX").value;
            var z = document.getElementById("newBuildingPosZ").value;
            var w = +(document.getElementById("newBuildingWidth").value)
            var y = +(document.getElementById("newBuildingPosY").value)
            var ny = y + (w/2);
            object.position.set(x,ny,z);
            object.scale.set(0.08,0.08,0.08);
            object.castShadow = true;
            object.type = "Mesh";
            myBuildings.add( object );

            

        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );
}

function addCottageHouse(){
    var textureLoader = new THREE.TextureLoader();
    var map = textureLoader.load('./assets/Cottage_Clean_Base_Color.png');
    var material = new THREE.MeshPhongMaterial({map: map});

    var loader = new THREE.OBJLoader();

    loader.load(
        // resource URL
        'assets/Cottage_FREE.obj',
        // called when resource is loaded
        function ( object ) {

            object.traverse( function ( node ) {
                if ( node.isMesh ) {
                    node.material = material;
                    node.castShadow = true;
                    node.receiveShadow = false;
                }
            });
            var x =document.getElementById("newBuildingPosX").value;
            var z = document.getElementById("newBuildingPosZ").value;
            var w = +(document.getElementById("newBuildingWidth").value)
            var y = +(document.getElementById("newBuildingPosY").value)
            var ny = y + (w/2);
            object.position.set(x,ny,z);
            object.scale.set(1.5,1.5,1.5);
            object.castShadow = true;
            object.type = "Mesh";
            myBuildings.add( object );

        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );
}

function addBuildingFromGlb(path) {
    
    /*var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath( 'assets/buildings/' );
    var url = "building_002.mtl";
    mtlLoader.load( url, function( materials ) {

        materials.preload();
*/

        var textureLoader = new THREE.TextureLoader();
        var map = textureLoader.load("../assets/"+ 'concrete.jpg');
        var materials = new THREE.MeshStandardMaterial({
            map: map
        });
        var objLoader = new THREE.OBJLoader();
        //objLoader.setMaterials( materials );
        objLoader.setPath( 'assets/buildings/' );
        objLoader.load( 'build11_obj.obj', function ( object ) {

            var scale = 0.5;
            
            var x =document.getElementById("newBuildingPosX").value;
            var z = document.getElementById("newBuildingPosZ").value;
            var w = +(document.getElementById("newBuildingWidth").value)
            var y = +(document.getElementById("newBuildingPosY").value)
            var ny = y + (w/2);
        
            var building = object.children[0];
            building.name = "building";
            building.material = materials;

            building.position.x = x;
            building.position.z = z;

            
            
            building.scale.set(scale,scale,scale);
            building.castShadow = true;
            building.receiveShadow = true;

            myBuildings.add( building );

        });

    //});
}


function doHandleLightIntensity(){
    document.getElementById("btnResetLightIntensity").onclick = function(){
        removeArrows()
        function removeArrows(){
            for (var i = lightIntensityBars.children.length - 1; i >= 0; i--) {
                lightIntensityBars.remove(lightIntensityBars.children[i]);
            }
        }
    };

    document.getElementById("checkLightIntensityRay").onchange = function(){
        if (!document.getElementById("checkLightIntensityRay").checked){
            removeArrows();
        }
    };
}

function doHandleLandmark(){
    document.getElementById("btnCalculateLandmark").onclick = function(){doCalculateLandmark()};
    document.getElementById("btnRemoveLandmarkRays").onclick = function(){
        removeArrows();
        document.getElementById("numBuildings").innerHTML = "";
        document.getElementById("numHitBuildings").innerHTML = "";
        document.getElementById("landmarkVis").innerHTML = "";
        landmarkPool = new Array();
        for (var i=0; i<myBuildings.children.length; i++){
            landmarkPool.push(myBuildings.children[i]);
            myBuildings.children[i].material.opacity = 1;
        }
    };
    document.getElementById("checkAllBuildings").onchange = function(){
        if (document.getElementById("checkAllBuildings").checked){
            landmarkPool = new Array();
            for (var i=0; i<myBuildings.children.length; i++){
                myBuildings.children[i].material.opacity = 1;
                landmarkPool.push(myBuildings.children[i]);
            }
        } else {
            landmarkPool = new Array();
        }
    };

}

function doCalculateLandmark(){
    console.log("Calculating landmark ....");

    if (currentLandmark !=null){
        var geo = currentLandmark.geometry;

        console.log("Current landmark: ", currentLandmark);

        var height, width, depth;
        var x, y, z;

        var center = getCenterPoint(currentLandmark);

        x = Math.round(center.x);
        y = center.y;
        z = Math.round(center.z);

        if (geo instanceof THREE.BufferGeometry){
            height = Math.abs(geo.boundingBox.min.x) + Math.abs(geo.boundingBox.max.x);
            width = Math.abs(geo.boundingBox.min.y) + Math.abs(geo.boundingBox.max.y);
            depth = Math.abs(geo.boundingBox.min.z) + Math.abs(geo.boundingBox.max.z);
        } else {
            height = geo.parameters.height;
            width = geo.parameters.width;
            depth = geo.parameters.depth;
            
        }
        var hitBuildings = [];
        var levels = Math.round(width*2);
        console.log("Levels: ", levels);
        for (var i=0; i<levels; i++){

            var customY = (y-(width/2))+(i*(width/levels));

            var origin = new THREE.Vector3(x,customY, z);

            for(var j=0; j<360; j+=1){
                var direction = new THREE.Vector3(Math.sin((j*Math.PI)/180),0,Math.cos((j*Math.PI)/180)).normalize();
                
                var ray = new THREE.Raycaster(origin,direction);
                ray.near= 1;
                ray.far = 1000;
                
                var results = ray.intersectObjects(landmarkPool);
                
                if(results.length>0){

                    var hitBuilding = results[0].object;
                    drawArrow(direction, origin, results[0].distance);

                    if (!hitBuildings.includes(hitBuilding.id)){

                        hitBuildings.push(hitBuilding.id);
                        

                    }
                }
            }
        }

        var numBuildings = landmarkPool.length;
        var numHitBuildings = hitBuildings.length;
        var landmarkVis = (numHitBuildings/numBuildings)*100;

        updateLandmarkValues(numBuildings, numHitBuildings, landmarkVis);
        
    }
}

function getCenterPoint(mesh) {
    var geometry = mesh.geometry;
    geometry.computeBoundingBox();   
    center = geometry.boundingBox.getCenter();
    mesh.localToWorld( center );
    return center;
}

function updateLandmarkValues(numBuild, numHit, visPercentage){
    document.getElementById("numBuildings").innerHTML = "Buildings: " + numBuild;
    document.getElementById("numHitBuildings").innerHTML = "Hit: " + numHit;
    document.getElementById("landmarkVis").innerHTML = "Landmark Vis: " + visPercentage + "%";
}

function doHandleSkyExposureListener() {
    document.getElementById("btnCalculateSkyExposure").onclick = function(){
        var x = document.getElementById("skyExposurePosX").value;
        var y = document.getElementById("skyExposurePosY").value;
        var z = document.getElementById("skyExposurePosZ").value;

        var disp = document.getElementById("checkShowSkyExposure").checked;
        removeBysid('line');
        calcSkyExposure(x,y,z, disp);

        
    };
    document.getElementById("checkShowSkyExposure").onchange = function(){
        checkShowSkyExposure = document.getElementById("checkShowSkyExposure").checked;

        if (!checkShowSkyExposure){
            removeBysid('line');
        }
    };
    document.getElementById("btnRemoveArrows").onclick = function(){
        removeArrows();
        document.getElementById("skyVisValue").innerHTML = "";
    };
}


function calcSkyExposure(x,y,z, disp){
    var origin = new THREE.Vector3(Math.round(x),Math.round(y),Math.round(z+5000));
    console.log("Origin before: ", origin);

    var hit = 0;
    var numRays = 0;
    for (j=0;j<90;j+=10){
            for (i=0;i<360;i+=20){
                numRays++;
                var direction = new THREE.Vector3(Math.sin((i*Math.PI)/180),Math.cos(((j)*Math.PI)/180),Math.cos((i*Math.PI)/180)).normalize();
                
                scene.updateMatrixWorld();
            
                var ray = new THREE.Raycaster(origin, direction);
                ray.near = 1.5;
                ray.far = 1000;

                var results = ray.intersectObjects(scene.children,true);
                
                if (results.length>0){
                    hit++;
                    if (disp){
                        drawArrow(direction, origin, results[0].distance);
                    }
                }
            }
    }

    var skyExposure = ((numRays-hit)/numRays)*100;
    document.getElementById("skyVisValue").innerHTML = "Sky Visibility: " + Math.round(skyExposure) +"%";


}

function drawArrow(dir, orig, dist){
    var arrow = new THREE.ArrowHelper(dir, orig, dist, 0xff0000, 0,0);
    myArrows.add(arrow);
}

function removeArrows(){
    for (var i = myArrows.children.length - 1; i >= 0; i--) {
        myArrows.remove(myArrows.children[i]);
    }
}

let createLine = function(origin, dir, length) {
    let o = origin.clone();
    let goal = new THREE.Vector3();
    goal= dir.multiplyScalar(length);
    let geometry = new THREE.Geometry();
    geometry.vertices.push(o);
    geometry.vertices.push(goal);
    let material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    let line = new THREE.Line(geometry, material);
    line.name = "line";
    scene.add(line);
    console.log("lines added");
}

function removeBysid(id) {
    scene.traverse(function(element) {
        if (element.name == 'line') {
            scene.remove(scene.getObjectByName(element.name));
            // And since you know it's unique...
            return;
        }
    })
}

function doHandleSunControlListeners(){
    
    doHandleSunSlider();
    doHandleCameraHelperInput();
    doHandleSunAnimationInput();

}

function doHandleSunSlider(){
    var slider = document.getElementById("sunRange");
    var sliderOutput = document.getElementById("sunRangeValue");
    sliderOutput.innerHTML = slider.value;

    slider.oninput = function() {
        sliderOutput.innerHTML = this.value;
        rotateSun(this.value);
    }
}

function doHandleCameraHelperInput(){
    document.getElementById("checkCameraHelper").onchange = function(){
        var check = document.getElementById("checkCameraHelper").checked;

        if (check){
            var helper = new THREE.CameraHelper( sunLight.shadow.camera );
            helper.name = "sunLightHelper";
            scene.add(helper);
        } else {
            var sunLightHelper = scene.getObjectByName("sunLightHelper");
            scene.remove(sunLightHelper);
        }
    }
}

function doHandleSunAnimationInput(){
    document.getElementById("checkSunAnimation").onchange = function(){
        sunAnimateCheck = document.getElementById("checkSunAnimation").checked;
    }
}

function doHandleBuildingListeners(){
    document.getElementById("btnNewBuilding").onclick = function(){

        var x =document.getElementById("newBuildingPosX").value;
        
        var z = document.getElementById("newBuildingPosZ").value;
        var h =document.getElementById("newBuildingHeight").value;
        var w = document.getElementById("newBuildingWidth").value
        var d = document.getElementById("newBuildingDepth").value
        var tex = document.getElementById("newTex").value
        var y = +(document.getElementById("newBuildingPosY").value)
        var ny = y + (w/2);

        newBuilding(x,ny,z,h,w,d,tex);
        };
    document.getElementById("btnRemoveBuilding").onclick = function(){removeBuilding()};
    document.getElementById("btnUpdateBuilding").onclick = function(){updateBuilding()};
    document.getElementById("btnSetAsLandmark").onclick = function(){
        landmarkPool = [];
        for (var i=0; i<myBuildings.children.length; i++){
            landmarkPool.push(myBuildings.children[i]);
        }
        setAsLandmark()};
}

function doHandleSaveLoad(){
    document.getElementById("btnSaveScene").onclick = function(){exportScene()};
    document.getElementById("fileEx").onchange = function(){
        var output = "";
        reader = new FileReader();
        var gloader = new THREE.GLTFLoader();
        reader.onload = function (e) {
            output = e.target.result;
            console.log(output);

            while(scene.children.length > 0){ 
                scene.remove(scene.children[0]); 
            }
            // Parse the modified glTF JSON using THREE.GLTFLoader.
            
            gloader.parse( output, './assets/', ( gltf ) => {
                // Add the result to the scene.
                console.log(scene);
                scene.add(gltf.scene);
                console.log("scene after: ",scene.children);

                myObjects = scene.getObjectByName("MyObj");
                myBuildings = myObjects.getObjectByName("MyBuildings");
                myArrows = new THREE.Object3D();
                myArrows.name = "MyArr";
                scene.add(myArrows);
                lightIntensityBars = new THREE.Object3D();
                lightIntensityBars.name = "lightIntensityBars";
                scene.add(lightIntensityBars);

                createSun();
                var ambient = new THREE.AmbientLight(0xeeeeee, 0.3);
                scene.add(ambient);
                
            });

            

        };//end onload()
        reader.readAsArrayBuffer(document.getElementById("fileEx").files[0]);
    };
}

function loadBlenderTerrain() {
    var gloader = new THREE.GLTFLoader();
    // Load a glTF resource
    gloader.load(
        // resource URL
        './assets/terrain/swissterrain_small2.glb',
        // called when the resource is loaded
        function ( gltf ) {


            var scale = 0.03;

            console.log(gltf.scene);
            
        
            var terrain = gltf.scene.children[gltf.scene.children.length-1];
            terrain.name = "terrain";
            
            terrain.scale.set(scale,scale,scale);
            terrain.castShadow = true;
            terrain.receiveShadow = true;

            myObjects.add( terrain );
            console.log("antall: ", gltf.scene.children.length);
            for(var i=0; i<gltf.scene.children.length; i++){
                console.log("Num iter; ", i);
                var child = gltf.scene.children[i].clone();
                
                console.log("type: ", child.type);
                if (child.type == "Mesh"){
                    child.name = "building";
                    child.scale.set(scale,scale,scale);
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if(i<20){
                    var textureLoader = new THREE.TextureLoader();
                    var textures = ["tex1.jpg","tex2.jpg","tex3.jpg","tex4.jpg", "concrete.jpg"];
                    var max = 4;
                    var min = 0;
                    let random = Math.floor(Math.random()*(max-min+1)+min);
                    console.log(random);
                    var map = textureLoader.load("./assets/"+ textures[random]);
                    var material = new THREE.MeshStandardMaterial({
                        map: map
                    });
                    } else {
                    
                    material = new THREE.MeshStandardMaterial(0xff0000);
                }
                    child.material = material;
                    myBuildings.add(child)
                }
                
            }
            
            var ambient = new THREE.AmbientLight(0xeeeeee, 0.5);
            scene.add(ambient);

            console.log("Scene after terrain import: ", scene.children);

        },
        // called while loading is progressing
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );
}


function loadBlenderTerrainOSM() {
    var gloader = new THREE.GLTFLoader();
    // Load a glTF resource
    gloader.load(
        // resource URL
        './assets/terrain/aalesund_map.glb',
        // called when the resource is loaded
        function ( gltf ) {


            var scale = 1;

            console.log(gltf.scene);
            
        
            var terrain = gltf.scene.children[gltf.scene.children.length-1];
            terrain.name = "terrain";
            
            terrain.scale.set(scale,scale,scale);
            terrain.castShadow = true;
            terrain.receiveShadow = true;

            myObjects.add( terrain );
            console.log("antall: ", gltf.scene.children.length);
            for(var i=0; i<gltf.scene.children.length; i++){
                console.log("Num iter; ", i);
                var child = gltf.scene.children[i].clone();
                if(child.type == "Object3D"){
                    for (var j =0;j<child.children.length; j++){
                        var objParent = child.children[j].clone();
                        for (var k = 0; k< objParent.children.length;k++){
                            var mesh = objParent.children[k].clone();
                            if (mesh.type == "Mesh"){
                                mesh.name = "building";
                                mesh.scale.set(scale,scale,scale);
                                mesh.castShadow = true;
                                mesh.receiveShadow = true;
                                mesh.position.set(objParent.position.x, objParent.position.y,objParent.position.z);
                                
                                
                                
                                material = new THREE.MeshStandardMaterial(0xff0000);
                            
                                mesh.material = material;
                                myBuildings.add(mesh)
                            }
                        }
                    }
                }
                console.log("type: ", child.type);
                
                
            }
            
            var ambient = new THREE.AmbientLight(0xeeeeee, 0.5);
            scene.add(ambient);

            console.log("Scene after terrain import: ", scene.children);

        },
        // called while loading is progressing
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );
}


function newBuilding(x,y,z,height,width,depth,tex){


    var textureLoader = new THREE.TextureLoader();
    var map = textureLoader.load("../assets/"+ tex);
    var material = new THREE.MeshStandardMaterial({
        map: map
    });
    var geo = new THREE.CubeGeometry( height, width, depth );
    var cube = new THREE.Mesh( geo, material );
    cube.receiveShadow=true;
    cube.castShadow=true;
    cube.position.set(x,y,z);
    cube.name = "building";
    myBuildings.add(cube);
    currentObjId = cube.id;

}

function removeBuilding(){
    myBuildings.remove(myBuildings.getObjectById(currentObjId));
}

function updateBuilding(){
    var posX, posY, posZ, currWidth, currHeight, currDepth;

    myBuildings.remove(myBuildings.getObjectById(currentObjId));

    posX = document.getElementById("currentBuildingPosX").value;
    posY = document.getElementById("currentBuildingPosY").value;
    posZ = document.getElementById("currentBuildingPosZ").value;

    currWidth = document.getElementById("currentBuildingWidth").value;
    currHeight = document.getElementById("currentBuildingHeight").value;
    currDepth = document.getElementById("currentBuildingDepth").value;

    tex = document.getElementById("updateTex").value;

    newBuilding(posX,posY,posZ,currHeight,currWidth,currDepth,tex);
}

function setAsLandmark(){
    var child = myBuildings.children;
    for (var i = child.length - 1; i >= 0; i--) {
        child[i].material.opacity = 1;
    }
    currentLandmark = myBuildings.getObjectById(currentObjId);
    currentLandmark.material.opacity = 0.7;
}

function saveScene(){
    console.log("save scene");
    //document.getElementById("btnTest").innerHTML = "Test";
}

function addAxisHelper(){
    // Add axes
    var axes = new THREE.AxisHelper(50);
    scene.add( axes );

}

function resize(){
  let w = window.innerWidth;
  let h = window.innerHeight;
  
  renderer.setSize(w,h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

var inclination = 0;
// Renders the scene
function animate() {
    if(sunAnimateCheck){
        inclination += 0.1;
        if (inclination >= 100){
            inclination = 0;
        }
        rotateSun(inclination);
    }

    if (lightIntensityBars.children.length > 0 && document.getElementById("checkRealTime").checked){
        renderLightBars();
    }

  renderer.render( scene, camera );
  controls.update();

   

  requestAnimationFrame( animate );
}