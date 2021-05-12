let winEnv = document.querySelector('body');

winEnv.addEventListener("keydown",(e)=>{
    if (e.keyCode === 13 ) {
        e.preventDefault();
    }
})