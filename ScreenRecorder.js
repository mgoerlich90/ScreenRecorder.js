class ScreenRecorder {
    constructor(onstop) {
        this.thumb = null
        this.mediaRecorder = null
        this.screenStream = null
        this.videoType = 'video/webm'
        this.thumbType = 'image/png'
        this.onstop = onstop

        this._chunks = []
        this._canvas = document.createElement('canvas')
    }

    start() {
        ScreenRecorder.requestStream().then(stream => {
            this.screenStream = stream
            this.record()
        })
    }

    stop() {
        this.mediaRecorder.stop()
        let blob = new Blob(this._chunks, { type: this.mimeType })
        this.video = URL.createObjectURL(blob)
        this.onstop(this.video, this.thumb)
        this.screenStream.getTracks().forEach(track => track.stop())
    }

    record() {
        if (this.mediaRecorder == null) {
            const chunkSize = 200
            this.mediaRecorder = new MediaRecorder(this.screenStream)
        }

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size <= 0) return
            this._chunks.push(e.data)
            if (!this.thumb) this._captureThumb()
        }

        this.mediaRecorder.onstop = () => {
            this._chunks = []
            this.thumb = null
        }

        this.mediaRecorder.start(1000)
    }

    async _captureThumb() {
        let track = this.screenStream.getVideoTracks()[0]
        if (track.readyState != 'live') return

        let ic = new ImageCapture(track),
            frame = await ic.grabFrame(),
            context = this._canvas.getContext('2d')

        this._canvas.width = frame.width
        this._canvas.height = frame.height
        context.drawImage(frame, 0, 0)
        this.thumb = this._canvas.toDataURL()
    }


    static async requestStream() {
        return await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: { mediaSource: "screen" }
        })
    }
}