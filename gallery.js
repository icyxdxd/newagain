function initializeGallery() {
    console.log("Page loaded — initializing gallery");

    let images = document.querySelectorAll(".preview");

    for (let i = 0; i < images.length; i++) {
        images[i].setAttribute("tabindex", "0");
    }
}

function upDate(previewPic) {
    console.log("Event triggered for:", previewPic.alt);

    let imageDiv = document.getElementById("image");

    imageDiv.innerHTML = previewPic.alt;
    imageDiv.style.backgroundImage = "url('" + previewPic.src + "')";
}

function unDo() {
    console.log("Reset triggered");

    let imageDiv = document.getElementById("image");

    imageDiv.innerHTML = 
        "Hover over or focus on an image below to display here.";
    imageDiv.style.backgroundImage = "url('')";
}