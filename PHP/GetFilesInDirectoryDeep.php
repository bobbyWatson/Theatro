<?php

$directory = "../" . $_GET["directory"];

echo json_encode(getDirContents($directory));

function getDirContents($dir, &$results = array()){
    $files = scandir($dir);

    foreach($files as $key => $value){
        $path = $dir.DIRECTORY_SEPARATOR.$value;
        if(!is_dir($path)) {
            $results[] = $path;
        } else if($value != "." && $value != "..") {

            getDirContents($path, $results);
            $results[] = $path;
        }
    }

    return $results;
}

?>