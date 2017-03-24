"use strict";
/**
 * Created by danhuan on 2017/2/23.v1.1
 */


var danYuanMian_geoJSON;
var map, waiKuanMian, louKongMian, gongGongDian, danYuanMian;
var hasClickFeature = false;//全局变量
var preClickFeature; //记录上一个点击的单元面

function LeafMap() {};
LeafMap.prototype = {
    /*返回 填充样式
     *getFeatureStyle(feature)
     */
    getFeatureStyle: function (feature) {
        var styleFill = {};//填充样式map
        //循环style.js获取填充样式形成map
        for (var j = 0; j < stypeConfig.configs.length; j++) {
            var objFill = stypeConfig.configs[j];
            styleFill[objFill.key] = objFill;
        }
        if(feature.properties&&feature.properties.STYLE){
            var colorType = styleFill[feature.properties.STYLE];
        }
        if (colorType) {
            return colorType;
        } else {
            //console.log(feature.properties);
            //console.log('style.js没有找到 ' + feature.properties.STYLE + ' 的样式,使用默认样式');
            return styleFill['默认'];
        }
    },

    /*返回 图标
     *getFeatureIcon(feature)
     */
    getFeatureIcon: function (feature) {
        var styleIcons = {}; //图标map
        for (var j = 0; j < stypeConfig.icons.length; j++) {
            var objIcon = stypeConfig.icons[j];
            styleIcons[objIcon.name] = objIcon;
        }
        if(feature.properties&&feature.properties.NAME){
            var iconType = styleIcons[feature.properties.NAME];
            return iconType;
        }else{
            console.log("楼层json找不到图标名称,使用未知图标");
            return styleIcons["未知"];
        }
    },

    /**
     *  单元面 高亮显示
     */
    highlightFeature: function (e) {
        var layer = e.target;

        layer.setStyle({
            weight: 2,
            color: '#03a9f4',
            dashArray: '',
            fillColor: "yellow",
            fillOpacity: 0.5
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    },

    /**
     * 单元面 mouseout事件将图层样式重置为其默认状态
     */
    resetHighlight: function (e) {
        danYuanMian_geoJSON.resetStyle(e.target);
    },

    clickToFeature: function (e) {
        //点击高亮单元面
        if (hasClickFeature) {
            danYuanMian_geoJSON.resetStyle(preClickFeature.target);
            leafmap.highlightFeature(e);
            preClickFeature = e;
        } else {
            //第一次点击
            preClickFeature = e;
            leafmap.highlightFeature(e);
            hasClickFeature = true;
        }


        /*//添加开始marker标记
         if (hasStartPoint) {
         startPoint.remove();
         //            console.log(e);
         //startPoint = L.marker(e.latlng);//鼠标点击单元面的点
         startPoint = L.marker(e.target.getCenter());//单元面中点,有问题:对于凹型面,可能不打在面上,tooltip也存在这样的问题
         startPoint.addTo(map);
         } else {
         //第一次点击
         startPoint = L.marker(e.target.getCenter());
         startPoint.addTo(map);
         hasStartPoint = true;
         }
         //console.log(hasStartPoint);*/


        //地图放大聚焦到点击的单元面,缩放变为Zoom:20
        //map.fitBounds(e.target.getBounds(),{maxZoom:19});


        //单元面详细信息展示
        $(".description").slideDown('fast');//展开
        $(".description").click(function () {
            $(".description").slideUp('fast');//收起
        });
        if(e.target.feature.properties&&e.target.feature.properties.NAME){
            var name = e.target.feature.properties.NAME;
        }else{
            var name = "未知"
        }
        //console.log(e.target.feature.properties.NAME);
        $("#NAME").text(name);

        //收起切换楼层块
        if ($(".floor-choose-box .floor-choose-div").is(":visible")) {
            $(".floor-choose-box .floor-choose-div").slideUp('fast');//收起
        }
    },

    /*
     *创建地图
     */
    mapcreat: function (geojsonUrl) {
        $.ajax({
            timeout: 6E4,
            type: "GET",
            url: geojsonUrl,
            dataType: "text"
        }).done(function (data) {
            var geojson = eval("(" + data + ")");//将string转化为json
            //alert(typeof geojson);
            waiKuanMian = geojson.waiKuanMian;//全局变量
            louKongMian = geojson.louKongMian;
            gongGongDian = geojson.gongGongDian;
            danYuanMian = geojson.danYuanMian;

        }).error(function () {
            alert("地图文件解析失败");

        }).success(function (e) {


            map = new L.Map("map", {
                center: [23.13471918584834, 113.32151234149934],
                //zoom: 18,
                zoomSnap: 0.1,
                maxZoom: 23,
                minZoom: 17,
                //preferCanvas: true,//是否在渲染Canvas器上渲染
                maxBounds: ([[23.132846036559536, 113.31956015729906],[23.13665645841917, 113.32355572080614]])//地理围栏
            });
            //使地图zoom适应手机显示
            map.fitBounds([[23.13565645841917, 113.32255572080614], [23.133846036559536, 113.32056015729906]], {
                paddingTopLeft: [10, 10],
                paddingBottomRight: [10, 10]
            });

            /*L.tileLayer('http://t3.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}').addTo(map);*/


            //外框面
            L.geoJSON(waiKuanMian, {
                style: function (feature) {
                    var style = leafmap.getFeatureStyle(feature);
                    return style;
                }
            }).addTo(map);


            //镂空面
            L.geoJSON(louKongMian, {
                style: function (feature) {
                    var style = leafmap.getFeatureStyle(feature);
                    return style;
                }
            }).addTo(map);

            var collisionLayer2 = L.LayerGroup.collision({margin: 15});//单元面商标和名称碰撞
            //单元面
            danYuanMian_geoJSON = L.geoJSON(danYuanMian, {
                onEachFeature: function (feature, layer) {

                    var polygon = feature.geometry.coordinates;
                    var p = polylabel(polygon, 0.5);//获取单元面中心点坐标polylabel.js

                    //给单元面添加商标和名称
                    var baseballIcon = L.icon({
                        "name": "商标",
                        "iconUrl": 'img/logopics/4a4e4259.png',
                        "iconSize": [20, 20],
                        "iconAnchor": [10, 22]
                    });
                    if (layer.feature.properties&&layer.feature.properties.NAME) {
                        var NAME = layer.feature.properties.NAME;
                    } else {//如果没有NAME
                        var NAME = "";
                    }
                    var logolable = L.marker([p[1], p[0]], {
                        icon: baseballIcon,
                        opacity: 0,
                        interactive: false
                    }).bindTooltip(NAME, {interactive: false, permanent: true, direction: 'center', offset: [0, -5]})
                    collisionLayer2.addLayer(logolable);//单元面商标和名称碰撞
                    logolable.addTo(map);

                    //给单元面添加事件
                    layer.on({
//                    mouseover: highlightFeature,//手机不适用
//                    mouseout: resetHighlight,//手机不适用
                        click: leafmap.clickToFeature
                    });
                },
                style: function (feature) {
                    var style = leafmap.getFeatureStyle(feature);
                    return style;
                }
            }).addTo(map);
            collisionLayer2.addTo(map);//单元面商标和名称碰撞


//        var baseballIcon = L.icon({
//            "name": "到达口",
//            "iconUrl": 'img/facilities/airfield.png'
//        });
//        var danhuan = L.marker([23.134452233528785, 113.32158969087447]);
//        danhuan.addTo(map);
//        danhuan.remove();


            var collisionLayer = L.LayerGroup.collision({margin: 7});//公共点碰撞
            //公共点
            L.geoJSON(gongGongDian, {
                pointToLayer: function (feature, latlng) {
                    var styleIcon = leafmap.getFeatureIcon(feature);
                    var icon = L.icon(styleIcon);
                    var marker = L.marker(latlng, {icon: icon});
                    collisionLayer.addLayer(marker);//公共点碰撞
                    return marker;
                }
            }).addTo(map);
            collisionLayer.addTo(map);//公共点碰撞


            /* 增加水印 s*/
            L.Control.Watermark = L.Control.extend({
                onAdd: function (map) {
                    var img = L.DomUtil.create('img');

                    img.src = 'img/mapout-logo.png';
                    img.style.width = '100px';
                    img.style.opacity = '0.5';

                    return img;
                },

                onRemove: function (map) {
                    // Nothing to do here
                }
            });

            L.control.watermark = function (opts) {
                return new L.Control.Watermark(opts);
            }

            L.control.watermark({position: 'bottomright'}).addTo(map);
            /* 增加水印 e*/

            /*==============自定义创建面板 导航层面板,包含起点\终点\导航线  s=====================*/
            /*
             map.createPane('naviPane');
             /!* 起点终点s*!/
             var iconStart = L.icon({
             "name": "起点",
             "iconUrl": 'img/start-marker-icon.png',
             iconSize: [25, 40],
             iconAnchor: [12, 38],//????????????
             "title": "起点"
             });
             var iconEnd = L.icon({
             "name": "终点",
             "iconUrl": 'img/end-marker-icon.png',
             iconSize: [40, 40],
             iconAnchor: [20, 38],//????????????
             "title": "终点"
             });

             var hasStartPoint = false;//全局变量
             var hasEndPoint = false;//全局变量
             var startPoint;//开始标记
             var startPointCoordinate;//开始坐标
             var endPoint;//结束标记
             var endPointCoordinate;//结束坐标

             //添加开始marker标记
             map.on('click', function (e) {
             if (!hasStartPoint) {
             //第一次点击,添加开始标记
             startPoint = L.marker(e.latlng, {icon: iconStart, draggable: true, pane: 'naviPane'});
             startPoint.addTo(map);
             startPointCoordinate = [e.latlng.lng, e.latlng.lat];

             hasStartPoint = true;
             } else if (!hasEndPoint) {
             //第二次点击,添加结束标记
             //startPoint.remove();
             endPoint = L.marker(e.latlng, {icon: iconEnd, draggable: true, pane: 'naviPane'});//鼠标点击单元面的点
             endPoint.addTo(map);
             endPointCoordinate = [e.latlng.lng, e.latlng.lat];
             hasEndPoint = true;
             //画线
             var naviLines = [{
             "type": "LineString",
             "coordinates": [startPointCoordinate, endPointCoordinate]
             }];
             leafmap.drawLine(naviLines);
             }
             });
             /!* 起点终点e*!/

             */
            /*==============自定义创建面板 导航层面板,包含起点\终点\导航线  e=====================*/

        });
    },

    /*
     画导航线
     */
    drawLine: function (jsonLines) {
        var myStyle = {
            "color": "#ff7800",
            "weight": 4,
            "opacity": 1
        };
        L.geoJSON(jsonLines, {
            pane: 'naviPane',
            style: myStyle
        }).addTo(map);
    },


    /*
     * geojsonUrl:默认加载楼层文件路径
     *
     */
    int: function (geojsonUrl) {
        this.mapcreat(geojsonUrl);//默认显示正佳一楼
        $('#currentFloor').click(function () {
            if ($(".floor-choose-box .floor-choose-div").is(":hidden")) {
                $(".floor-choose-box .floor-choose-div").slideDown('fast');//展开
            } else {
                $(".floor-choose-box .floor-choose-div").slideUp('fast');//收起
            }
        });
        //切换楼层
        $("#floorChooseList li").click(function () {
            if ($(".description").is(":visible")) {
                $(".description").slideUp('fast');//收起
            }
            $("#floorChooseList li").removeClass("active");
            $(this).addClass("active");
            var floorIndex = $(this).text();
            $('#currentFloor').text(floorIndex);
            map.remove();//销毁map
            var buildingId = "zhengjia";
            var floorId = $(this).attr("id");
            geojsonUrl = "js/" + buildingId + floorId + ".json";
            //console.log(geojsonUrl);
            leafmap.mapcreat(geojsonUrl);
        });
    }
};

var leafmap = null;//实例化地图
$(function () {
    leafmap = new LeafMap();//实例化地图
    var geojsonUrl = "js/zhengjiaF1.json";//默认显示楼层Json
    leafmap.int(geojsonUrl);
});





