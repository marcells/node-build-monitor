function isNullOrWhiteSpace(str){
            return str === null || str.match(/^ *$/) !== null;
        }

function timeOutput(startedAt, finishedAt, lastChangeAt, buildFinished) {
    var output = startedAt.toLocaleString();

    if (buildFinished) { 
        output += ' - ' + finishedAt.toLocaleString() + ' (' + (finishedAt.getTime() - startedAt.getTime()) / 1000 + ' seconds)';
    } else {
        output += ' (currently running: ' + (lastChangeAt.getTime() - startedAt.getTime()) / 1000 + ')';
    }

    return output;
}

var socket = io.connect('http://localhost:3000');
socket.on('buildstate', function (data) {
    console.log(data);

    if (data) {
        var ul = document.querySelector('#builds');

        ul.innerHTML = '';

        for(var i=0; i < data.builds.length; i++) {
            var build = data.builds[i];
            var startedAt = new Date(build.startedAt);
            var finishedAt = new Date(build.finishedAt);
            var lastChangeAt = new Date(build.lastChangeAt);

            var li = '<div class="flex-item {COLOR}">'
                + '<span class="title">'
                + build.project
                + '</span>'
                + ' -> '
                + '<span class="title">'
                + build.definition
                + '</span>'
                + ' -> '
                + '<span class="title">'
                + build.number
                + '</span>'
                + '<div class="duration">'
                + timeOutput(startedAt, finishedAt, lastChangeAt, build.buildFinished)
                + '<div>'
                + '<div class="status">'
                + build.status
                + '</div>'
                + '<span class="reason">'
                + build.reason
                + '</span>'
                + ' for '
                + '<span class="for">'
                + build.requestedFor
                + '</span>'
                + '<div class="warnings">'
                + '[ warnings: ' + !isNullOrWhiteSpace(build.warnings) + ', errors: ' + !isNullOrWhiteSpace(build.errors) + ']'
                + '</div>'
                + '</div>';

            li = li.replace('{COLOR}', build.status + '-color');

            ul.innerHTML += li;
        }
    }
});