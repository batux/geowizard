# geowizard js

## GeoWizard JS 1.0

GeoWizard uses native Javascript and Google Maps JS library to export or import GeoJSON from user drawed geometries which are on map. You can get GeoJSON as text, also you can import GeoJSON to data layer easily. It provides an abstraction level about GIS operatons for developers. After you exported GeoJSON, you can save it as a draft GIS project in local storage or WebSQL database on browsers. I will be happy to hear constructive comments or criticisms about this project. Come on! Let's continue to code!

## Dependencies

* Google Map Javascript API

## Screenshots about sample project which uses GeoWizard JS 1.0

![1](https://user-images.githubusercontent.com/2838457/31579507-ad828a6a-b140-11e7-8c8e-de8e8c17f9b3.png)

![2](https://user-images.githubusercontent.com/2838457/31579508-ada7ec60-b140-11e7-9cdd-ff6c00fd99c4.png)

We exported GeoJSON from all drawed geometries.

![3](https://user-images.githubusercontent.com/2838457/31579509-add44378-b140-11e7-8949-ab0e1b3485b4.png)

We can store draft projects on local storage or websql database. We have an index table which was named as 'drawing_project_index'. For that reason, so we can see either the project was stored in local storage or websql database.

![4](https://user-images.githubusercontent.com/2838457/31579510-adfc307c-b140-11e7-847c-1cf660b976cb.png)

We can see the projects which were saved in websql database. We store GeoJSON draft projects in 'drawing_project' table.

![5](https://user-images.githubusercontent.com/2838457/31579511-ae25b37a-b140-11e7-8736-e0a128701045.png)

We can see the projects which were saved in local storage.
