class MyCountdownTimer{

    constructor(id, roomname, io){
        this.id = id;
        this.roomname = roomname;
        this.io = io;
    }

    startTimer(startTime){
        this.remainingTime = this.startTime = startTime;

        this.interval = setInterval(()=>{
            if(this.remainingTime == 0){
                clearInterval(this.interval);
            }else{
                this.remainingTime--;
            }
        });
    }

    stopTimer(){
        clearInterval(this.interval);
    }
}