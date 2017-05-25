angular.module('app').controller('mainCtrl', function($scope, $http){
    
    let getData = function(){
        return $http.get('./pct-data.json').then(function(res){
            let data = res;
            initMap(data);
            //sends data to init map
        });
    }
    getData();

    let first = 0; //flag for first initialization
    let initMap = function(data, addMarker, p2) {
        
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 40.063030, lng: -119.859684},
            zoom: 5
        });     

        //function that puts original data into object structure
        function latlongMaker(data){
            for(let i = 0; i < 500; i++){
                let latlong = {
                    mile: data[i][0],
                    lat: data[i][1],
                    lng: data[i][2]
                }
                //storing data in local storage
                localStorage[i] = JSON.stringify(latlong); //stringify because local storage can only store strings
            }
        }
        //dont need to make new object after the first time, because can access with localstorage stored the first time
        if(first === 0){
            latlongMaker(data.data); 
            first++;
        }
        
        var flightPlanCoordinates = [];
        if(addMarker, p2){
            // console.log(addMarker, p2);
            var nearestPoints = [addMarker, p2];
            $scope.nearestPoints = new google.maps.Polyline({
                path: nearestPoints,
                strokeColor: 'blue',
                strokeOpacity: 1.0,
                strokeWeight: 2
            })
        }
        //function that creates the path on the map using local storage
        let createPath = function(){
            for(let i = 0; i < localStorage.length; i++){
                if(localStorage[i]){
                    flightPlanCoordinates.push(JSON.parse(localStorage[i]));
                }
            }
        }
        createPath();

        // console.log(flightPlanCoordinates);

        $scope.flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        

        $scope.flightPath.setMap(map);
        if(addMarker, p2){
            $scope.nearestPoints.setMap(map);
        }


        if(addMarker){
            var marker = new google.maps.Marker({
                position: addMarker,
                map: map,
                animation: google.maps.Animation.DROP,
            });
            marker.addListener('click', toggleBounce);
            // console.log(addMarker);
        }
    }
    function toggleBounce() {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }

    //logic for data to bind with $scope for LOCATION TABLE
    function jsonConvert(){
        let dest = []
        for(let i = 0; i < localStorage.length; i++){
            if(localStorage[i]){
                dest.push(JSON.parse(localStorage[i]));
            }       
        }
        $scope.positions = dest;
    }
    jsonConvert(localStorage);

    //showing input and save button
    $scope.edit = function(position){
        var click = 0
        // console.log(position);
        var items = document.getElementsByClassName(position);
        var point = items[0];
        var entry = items[1];
        var btn = items[2];
        point.innerHTML = '';
        entry.id = 'show';
        btn.id = 'show';
        $scope.newPosition = position; //binds the original position into the input
        // window.addEventListener('click', function(){
        //     click++;
        //     if(click === 2){
        //         point.innerHTML = position;
        //         entry.id = '';
        //         btn.id = '';
        //     }
        // })
    }
    
    //actually sending the new data into local storage
    $scope.saveNewPosition = function(mile, newPosition, position, oldPosition){
        // console.log(mile, newPosition, position, oldPosition);
        //getting html tags to hide them
        let items = document.getElementsByClassName(oldPosition);
        // console.log(items);
        let point = items[0];
        let entry = items[1];
        let btn = items[2];
        point.innerHTML = newPosition;
        entry.id = '';
        btn.id = '';
        
        for(let i = 0; i < localStorage.length; i++){
            let currentItem = JSON.parse(localStorage[i]);
            if(currentItem.mile === mile){
                currentItem[position] = Number(newPosition); //looks for which coordinate to update lat or long then assigns new position value
                localStorage[i] = JSON.stringify(currentItem)
                initMap();
                break;
            }
        }
    }

    $scope.delete = function(mile){
        let domItem = document.getElementsByClassName(mile); //getting the html element for the specific item
        // console.log(domItem);
        for(let i = 0; i < domItem.length; i++){
            domItem[i].style.display = 'none';
        }
        for(let i = 0; i < localStorage.length; i++){
            if(localStorage[i]){
                let currentItem = JSON.parse(localStorage[i]);
                if(currentItem.mile === mile){
                    delete localStorage[i];
                    // console.log(localStorage);
                    initMap();
                }
            }
        }
    }

    $scope.addMileMarker = function(lat, long){ 
        // console.log(lat, long);
        let lastItem = JSON.parse(localStorage[localStorage.length - 1]);
        let newMarker = {
            mile: lastItem.mile + 0.5,
            lat: Number(lat),
            lng: Number(long)
        }
        localStorage[localStorage.length] = JSON.stringify(newMarker);
        //reseting the input back to empty
        $scope.latitude = '';
        $scope.longitude = '';
        initMap();
        jsonConvert();
    }

    $scope.addMarker = function(lat, long){
        // console.log(lat, long);
        let addMarker = {
            lat: Number(lat),
            lng: Number(long),
        }
        initMap(null, addMarker);
        findNearest(localStorage, addMarker);
    }

    let findNearest = function(localStorage, addMarker){
        var nearest;
        for(var i = 0; i < localStorage.length; i++){
            if(localStorage[i]){ //avoid error when removing elements
                var trailPoints = JSON.parse(localStorage[i]);
                var distance = getDistance(trailPoints, addMarker);
                if(!nearest){
                    $scope.nearest = {
                        mile: trailPoints,
                        distance: (Math.round((distance * 0.000621371192) * 10) / 10).toString() + ' miles' //converting to miles
                    }
                    nearest = distance;
                } else if(nearest > distance){
                    $scope.nearest = {
                        mile: trailPoints,
                        distance: (Math.round((distance * 0.000621371192) * 10) / 10).toString() + ' miles'
                    }
                    nearest = distance;
                }
            }
        }
        // console.log(trailPoints);
        initMap(null, addMarker, $scope.nearest.mile);
    }

    var rad = function(x) {
        return x * Math.PI / 180;
    };

    //
    let getDistance = function(p1, p2) {
        let R = 6378137; // Earth’s mean radius in meter
        let dLat = rad(p2.lat - p1.lat);
        let dLong = rad(p2.lng - p1.lng);
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;
        return d; // returns the distance in meter
    };

    $scope.removeMarker = function(){
        initMap();
        $scope.nearest = null; //removing the blue path
        $scope.latpoint = '';
        $scope.longpoint = '';
        $scope.mile.mile = '';
    }

})
