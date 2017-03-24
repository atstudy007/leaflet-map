/*v1.0*/
$(function () {


    //切换楼层
    var geojsonUrl = "js/zhengjiaF1.json";
    mapcreat(geojsonUrl);//默认显示正佳一楼

    /**
     * 返回 填充样式
     */
    function getFeatureStyle(feature) {
        var styleFill = {};//填充样式map
        //循环style.js获取填充样式形成map
        for (var j = 0; j < stypeConfig.configs.length; j++) {
            var objFill = stypeConfig.configs[j];
            styleFill[objFill.key] = objFill;
        }
        var colorType = styleFill[feature.properties.STYLE];
        if (colorType) {
            return colorType;
        } else {
            //console.log(feature.properties);
            //console.log('style.js没有找到 ' + feature.properties.STYLE + ' 的样式,使用默认样式');
            return styleFill['默认'];
        }
    }


    /**
     * 返回 图标
     */
    function getFeatureIcon(feature) {
        var styleIcons = {}; //图标map
        for (var j = 0; j < stypeConfig.icons.length; j++) {
            var objIcon = stypeConfig.icons[j];
            styleIcons[objIcon.name] = objIcon;
        }
        var colorType = styleIcons[feature.properties.STYLE];
        if (colorType) {
            return colorType;
        }
    }


    /**
     *  单元面 高亮显示
     */
    function highlightFeature(e) {
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
    }

    /**
     *  单元面 mouseout事件将图层样式重置为其默认状态
     */
    function resetHighlight(e) {
        danYuanMian_geoJSON.resetStyle(e.target);
    }


    /**
     *  单元面 click监听器
     */

    var hasClickFeature = false;//全局变量
    var preClickFeature; //记录上一个点击的单元面
    function clickToFeature(e) {
//        console.log(e);
        //点击高亮单元面
        if (hasClickFeature) {
            danYuanMian_geoJSON.resetStyle(preClickFeature.target);
            highlightFeature(e);
            preClickFeature = e;
        } else {
            //第一次点击
            preClickFeature = e;
            highlightFeature(e);
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
//        map.fitBounds(e.target.getBounds(),{maxZoom:19.5});

        //单元面详细信息展示
        $(".description").animate({bottom: 0}, "slow");
        var name = e.target.feature.properties.NAME
        //console.log(e.target.feature.properties.NAME);
        $("#NAME").text(name);
    }


    /**
     *
     * @param geojsonUrl
     */
    function mapcreat(geojsonUrl) {
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
            alert("error");

        }).success(function (e) {

            map = new L.Map("map", {
                center: [23.13471918584834, 113.32151234149934],
                zoom: 18,
                zoomSnap: 0.1,
                maxZoom: 23,
                minZoom: 17,
//                    preferCanvas: true,//是否在渲染Canvas器上渲染
                maxBounds:([23.13599930122315, 113.3229821920395],[23.133434125175757, 113.32055018682945]),//地理围栏
            });
//        console.log(map.getBounds());
            //使地图适应手机显示zoom
            map.fitBounds([[23.13565645841917, 113.32255572080614], [23.133846036559536, 113.32056015729906]], {
                paddingTopLeft: [10, 10],
                paddingBottomRight: [10, 10]
            });


            //外框面
            L.geoJSON(waiKuanMian, {
                style: function (feature) {
                    var style = getFeatureStyle(feature);
                    return style;
                }
            }).addTo(map);


            //镂空面
            L.geoJSON(louKongMian, {
                style: function (feature) {
                    var style = getFeatureStyle(feature);
                    return style;
                }
            }).addTo(map);


            //单元面
            danYuanMian_geoJSON = L.geoJSON(danYuanMian, {
                onEachFeature: function (feature, layer) {
                    //给单元面添加事件
                    layer.on({
//                    mouseover: highlightFeature,//手机不适用
//                    mouseout: resetHighlight,//手机不适用
                        click: clickToFeature
                    });
                },
                style: function (feature) {
                    var style = getFeatureStyle(feature);
                    return style;
                }
            }).addTo(map);


//        var baseballIcon = L.icon({
//            "name": "到达口",
//            "iconUrl": 'img/facilities/airfield.png'
//        });
//        var danhuan = L.marker([23.134452233528785, 113.32158969087447]);
//        danhuan.addTo(map);
//        danhuan.remove();


            var collisionLayer = L.LayerGroup.collision({margin: 8});//图标\tooltip碰撞
            //公共点
            L.geoJSON(gongGongDian, {
                pointToLayer: function (feature, latlng) {
                    var styleIcon = getFeatureIcon(feature);
                    var icon = L.icon(styleIcon);
                    var marker = L.marker(latlng, {icon: icon});
                    collisionLayer.addLayer(marker);//图标碰撞
                    return marker;
                }
            }).addTo(map);

            //单元面带着tooltip,专门为tooltip添加,用于碰撞消除
            L.geoJSON(danYuanMian, {
                onEachFeature: function (feature, layer) {
                    //给单元面添加标签
                    if (layer.feature.properties.NAME) {
                        var NAME = layer.feature.properties.NAME;
                    } else {//如果没有NAME
                        var NAME = "";
                    }
                    var html = /*"<img src='img/logopics/4a4e4259204259204a4e4259.png' style='width: 20px;height: 20px;border: 1px solid rgba(169, 169, 169, 0.68);;border-radius: 50%;margin-right:5px;margin-top: 2px;vertical-align: bottom;'>"
                     +*/"<span>" + NAME + "</span>";

                    var Tooltip = layer.bindTooltip(html, {permanent: true, direction: 'center'});
                    collisionLayer.addLayer(Tooltip);//tooltip碰撞
                    Tooltip.addTo(map);


                    //给单元面添加事件
                    layer.on({
//                    mouseover: highlightFeature,//手机不适用
//                    mouseout: resetHighlight,//手机不适用
                        click: clickToFeature
                    });

                },
                style: function (feature) {
                    var style = getFeatureStyle(feature);
                    return style;
                }
            }).addTo(map);

            collisionLayer.addTo(map);//图标,tooltip碰撞


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

            /*自定义创建面板 导航层面板,包含起点\终点\导航线*/
            map.createPane('naviPane');
            /* 起点终点s*/
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
                    drawLine(naviLines);
                }
            });
            /* 起点终点e*/


        });
    }

    function drawLine(jsonLines){
        var myStyle = {
            "color": "#ff7800",
            "weight": 4,
            "opacity": 1
        };
        L.geoJSON(jsonLines, {
            pane: 'naviPane',
            style: myStyle
        }).addTo(map);
    }
});