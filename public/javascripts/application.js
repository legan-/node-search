$(function() {
  $tbody = $('#result').find('tbody');

  $.getJSON('/data.json', json => {
    if (json) {
      json.forEach(data => {
        let hash = data[1];
        let files = '';
        let sentences = '';

        $.each(data[2], (i, f) => {
          files += `<p>${f}</p>`;
        });

        $.each(data[3], (i, s) => {
          const regexp = x => RegExp(`(^|\\s)(${x})($|\\s|,|;|:)`, 'ig');

          let u = hash.toUpperCase();
          let l = hash.toLowerCase();
          let c = hash.charAt(0).toUpperCase() + hash.slice(1);

          s = s
            .replace(regexp(u), `$1<strong>$2</strong>$3`)
            .replace(regexp(l), `$1<strong>$2</strong>$3`)
            .replace(regexp(c), `$1<strong>$2</strong>$3`);
          sentences += `<p>${s}.</p>`;
        });

        $tbody.append(
          `<tr><td>${hash}</td><td>${files}</td><td>${sentences}</td></tr>`,
        );
      });
    }
  });
});
