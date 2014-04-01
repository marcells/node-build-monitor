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

            var li = '<li class="flex-item {COLOR}">'
                + '<b>'
                + build.project + '/' + build.definition + '/' + build.number
                + '</b>'
                + '<br>'
                + timeOutput(startedAt, finishedAt, lastChangeAt, build.buildFinished)
                + '<br>'
                + '<span color="blue">'
                + ' ==> Status: ' 
                + build.status 
                + ' (' + build.reason + ') '
                + '</span>'
                + '<br>'
                + '[ warnings: ' + !isNullOrWhiteSpace(build.warnings) + ', errors: ' + !isNullOrWhiteSpace(build.errors) + ']'
                + '</br>'
                + '</br>'
                + '</li>';

            li = li.replace('{COLOR}', build.status + '-color');

            ul.innerHTML += li;
        }
    }
});