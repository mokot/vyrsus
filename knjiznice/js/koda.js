var baza = 'mokot';
var baseUrl = 'https://teaching.lavbic.net/api/OIS/baza/' + baza + '/podatki/';

var map;
let geoPolygon = [];
var markerji = [];
let makeUporabnik;

var prvicMove;

var uporabnikLAT = 46.05004;
var uporabnikLNG = 14.46931;

var najblizjaBolnisnica;
var najmanjsaRazdalja;
var opisNajblizjeBolnisnice;
// Prikaz bolnic 15 km od tocke uporabnika
const razdaljaBolnisnicOdTocke = 25;

var uporabnikPodatki = [];
var uporabnikPodatkiID = "";

var testneOsebe;
var arthurDentEHRID = "7328g916-2r54-4e08-eo6h-52f761a0b245";
var fordPerfectEHRID = "afb58a32-e96b-4a34-8a53-79bf8640b514";
var zaphodBeeblebroxEHRID = "74dada5a-9d3a-4938-b255-d533160d0549";

// Ko se spletna stran nalozi
window.addEventListener('load', function() {

    console.log("Spletna stran nalozena.");

    if (window.location.href.endsWith("/index.html#") || window.location.href.endsWith("#")) {
        generirajPodatke();
    }

    // Nalaganje osnove spletne strani 'index.html'
    if (window.location.href.endsWith("/index.html") || window.location.href.endsWith("/")) {
        // Spletna stran 'index.html'

        // klik gumba generiraj podatke
        document.getElementById("generirajPodatkeGumb").addEventListener('click', function() {
            generirajPodatke();
        });

        // Za prikaz
/*
        document.getElementById("kreiranjeEHR").style.display = "block";
        document.getElementById("branjeEHR").style.display = "block";
        document.getElementById("vnostMeritev").style.display = "block";
        document.getElementById("pregledMeritev").style.display = "block";
        document.getElementById("novObstojeciUporabnik").style.display = "block";
        document.getElementById("testniUporabnik").style.display = "block";
        document.getElementById("gumbaZaIzbiroKreiranjaAliBranja").style.display = "block";
        document.getElementById("prikazPodatkov").style.display = "";
*/

        // prikaz statisktike
        pridobiPodatkeDanes();

        // Ko kliknemo na uporabnika, se nam prva gumba prikrijeta in druga prikazeta
        document.getElementById("uporabnikGumb").addEventListener('click', function() {
            deloZUporabnikom();
        });

        // Ko kliknemo na gumb z testnmi preberi
        document.getElementById("testGumb").addEventListener('click', function() {
            deloSTestnimiPrimeri();
        });


    }

    else if (window.location.href.endsWith("/bolnisnice.html")) {
        //console.log("Spletna stran 'bolnisnice.html' nalozena.");

        prvicMove = true;

        // ZEMLJEVID
        // Osnovne lastnosti mape
        var mapOptions = {
            center: [uporabnikLAT, uporabnikLNG],
            zoom: 1.5
        };

        // Ustvarimo objekt map
        map = new L.map('map', mapOptions);
        map.flyTo(new L.LatLng(uporabnikLAT, uporabnikLNG), 9);

        // Ustvarimo prikazni sloj mape
        var layer = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

        // Prikazni sloj dodamo na mapo
        map.addLayer(layer);

        // Dodamo zacetno lokacijo
        makeUporabnik = L.marker([uporabnikLAT, uporabnikLNG]);
        dodajMarker(uporabnikLAT, uporabnikLNG, "FAKULTETA ZA RAČUNALNIŠTVO IN INFORMATIKO", "uporabnik");

        map.on('mouseover', function() {
            // Ponastavimo checkbox
            document.getElementById("urgentniCenter").checked = true;
            document.getElementById("neurgentniCenter").checked = true;
            document.getElementById("ostalo").checked = true;
            if (prvicMove) {
                prikaziVseBolnisnice();
                prvicMove = false;
            }
        });

        // Objekt oblačka markerja
        function obKlikuNaMapo (e) {

            // Ob kliku pobrisemo celoten zemljevid
            odstraniVseTockeNaZemljevidu();
            prvicMove = false; // skrajen primer

            var latlng = e.latlng;

            uporabnikLAT = latlng.lat;
            uporabnikLNG = latlng.lng;

            var ikona = new L.Icon({
              iconUrl: './knjiznice/slike/marker.png',
              shadowUrl: './knjiznice/slike/markerSenca.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });

            // Ustvarimo marker z vhodnima podatkoma koordinat
            // in barvo ikone, glede na tip
            makeUporabnik = L.marker([uporabnikLAT, uporabnikLNG], {icon: ikona}).addTo(map)
                    .bindPopup("<img src='https://www.flaticon.com/premium-icon/icons/svg/2894/2894805.svg' style='height: 30px; width: auto;'/>");

            // Premaknemo se k tocki
            map.flyTo(new L.LatLng(uporabnikLAT, uporabnikLNG), 10);


            // Ponastavimo checkbox
            document.getElementById("urgentniCenter").checked = true;
            document.getElementById("neurgentniCenter").checked = true;
            document.getElementById("ostalo").checked = true;

            // prikazemo tocke na zemljevidu
            prikaziVseBolnisnice();
            //prikaziIzbraneTockeNaZemljevidu();
        }

        map.on('click', obKlikuNaMapo);

        // Ponastavimo checkbox
        document.getElementById("urgentniCenter").checked = false;
        document.getElementById("neurgentniCenter").checked = false;
        document.getElementById("ostalo").checked = false;

    }

});

//VYRSUS
// Delamo z novimi/obstojecimi uporabniki
function deloZUporabnikom() {
    document.getElementById("zacetnaGumba").style.display = "none";
    document.getElementById("navodilaZaUporabo").style.display = "none";
    document.getElementById("novObstojeciUporabnik").style.display = "";
    document.getElementById("statistika").style.display = "none";

    document.getElementById("vnosMeritevGumb").disabled = true;
    document.getElementById("pregledMeritevGumb").disabled = true;


    // Ko kliknemo da zelimo dodat uporabnika prikazemo polje za kreiranje EHR
    document.getElementById("novUporabnik").addEventListener('click', function() {
        deloZNovimUporabnikom();
    });

    /// delo z obstojecim uporabnikom
    document.getElementById("obstojeciUporabnik").addEventListener('click', function() {
        deloZObstojecimUporabnikom();
    });
}

// delo z novim delo novim uporabnikom
function deloZNovimUporabnikom() {
    document.getElementById("novObstojeciUporabnik").style.display = "none";
    document.getElementById("kreiranjeEHR").style.display = "";
    $("#ostalo").prop('checked', true);
    document.getElementById("gumbaZaIzbiroKreiranjaAliBranja").style.display = "";
    document.getElementById("pregledMeritevGumb").style.display = "none";

    // ko klinknemo na vnos meritev se nam pokaze polje za vnos meritev
    document.getElementById("vnosMeritevGumb").addEventListener('click', function() {
        document.getElementById("kreiranjeEHR").style.display = "none";
        document.getElementById("gumbaZaIzbiroKreiranjaAliBranja").style.display = "none";
        document.getElementById("vnostMeritev").style.display = "";
    });

    document.getElementById("pregledMeritevGumb").addEventListener('click', function() {
        document.getElementById("kreiranjeEHR").style.display = "none";
        document.getElementById("gumbaZaIzbiroKreiranjaAliBranja").style.display = "none";
        document.getElementById("pregledMeritev").style.display = "";
    });
}

// delo z obstojecim uporabnikom
function deloZObstojecimUporabnikom() {

    dodajUporabnikeBranjeEHR();

    document.getElementById("novObstojeciUporabnik").style.display = "none";
    document.getElementById("branjeEHR").style.display = "";
    document.getElementById("gumbaZaIzbiroKreiranjaAliBranja").style.display = "";

    // ko klinknemo na vnos meritev se nam pokaze polje za vnos meritev
    document.getElementById("vnosMeritevGumb").addEventListener('click', function() {
        document.getElementById("kreiranjeEHR").style.display = "none";
        document.getElementById("gumbaZaIzbiroKreiranjaAliBranja").style.display = "none";
        document.getElementById("branjeEHR").style.display = "";
        document.getElementById("vnostMeritev").style.display = "";
    });

    document.getElementById("pregledMeritevGumb").addEventListener('click', function() {
        document.getElementById("kreiranjeEHR").style.display = "none";
        document.getElementById("gumbaZaIzbiroKreiranjaAliBranja").style.display = "none";
        document.getElementById("branjeEHR").style.display = "";
        document.getElementById("pregledMeritev").style.display = "";
    });
}

//Delamo s tesnimi primeri
function deloSTestnimiPrimeri() {
    document.getElementById("zacetnaGumba").style.display = "none";
    document.getElementById("navodilaZaUporabo").style.display = "none";
    document.getElementById("statistika").style.display = "none";
    document.getElementById("testniUporabnik").style.display = "";
    document.getElementById("izberiteSiTestnegaUporabnika").style.display = "";

    document.getElementById("arthurDentGumb").addEventListener('click', function() {
        prikazPodatkovArthurDent();
    });

    document.getElementById("fordPerfectGumb").addEventListener('click', function() {
        prikazPodatkovFordPerfect();
    });

    document.getElementById("zaphodBeeblebroxGumb").addEventListener('click', function() {
        prikazPodatkovZaphodBeeblerox();
    });
}

function prikazPodatkovArthurDent() {
    preberiMeritveVitalnihZnakovTestneOsebeArthurDent();
    document.getElementById("izberiteSiTestnegaUporabnika").style.display = "none";
    document.getElementById("testniUporabnik").style.display = "none";
    document.getElementById("arthurDentPolje").style.display = "";
    document.getElementById("skupinaGumbovZaIzbiroTesta").style.display = "";
}

function prikazPodatkovFordPerfect() {
    preberiMeritveVitalnihZnakovTestneOsebeFordPerfect();
    document.getElementById("izberiteSiTestnegaUporabnika").style.display = "none";
    document.getElementById("testniUporabnik").style.display = "none";
    document.getElementById("fordPerfectPolje").style.display = "block";
    document.getElementById("skupinaGumbovZaIzbiroTesta").style.display = "";
}

function prikazPodatkovZaphodBeeblerox() {
    preberiMeritveVitalnihZnakovTestneOsebeZaphodBeeblerox();
    document.getElementById("izberiteSiTestnegaUporabnika").style.display = "none";
    document.getElementById("testniUporabnik").style.display = "none";
    document.getElementById("zaphodBeebleroxPolje").style.display = "";
    document.getElementById("skupinaGumbovZaIzbiroTesta").style.display = "";
}

// Shranjevanje na lavbic API
/**
 * Generiranje enoličnega identifikatorja, ki ga uporabimo za
 * EHR zapis pacienta.
 */
function generirajID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Kreiraj nov EHR zapis za pacienta in dodaj osnovne demografske podatke
 * (ime, priimek in datum rojstva). V primeru uspešne akcije izpiši sporočilo
 * s pridobljenim EHR ID, sicer izpiši napako.
 */
function kreirajEHRzaBolnika() {
	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
    var spol = $("input[name='spol']:checked").val();
  var datumRojstva = $("#kreirajDatumRojstva").val();
	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
    var ehrID = generirajID();
    var podatki = {
      ime: ime,
      priimek: priimek,
      spol: spol,
      datumRojstva: datumRojstva
    };
		$.ajax({
      url: baseUrl + "azuriraj?kljuc=" + ehrID,
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify(podatki),
      success: function (data) {
        $("#kreirajSporocilo").html("<span class='obvestilo " +
          "label label-success fade-in'>Uspešno kreiran EHR '" +
          ehrID + "'.</span>");
        $("#preberiEHRid").val(ehrID);
        $("#dodajVitalnoEHR").val(ehrID);
        $("#meritveVitalnihZnakovEHRid").val(ehrID);
        $("#kreirajIme").val("");
      	$("#kreirajPriimek").val("");
        $("#" + spol).prop('checked', false);
        $("#ostalo").prop('checked', true);
        $("#kreirajDatumRojstva").val("");

        document.getElementById("vnosMeritevGumb").disabled = false;
      },
      error: function(err) {
        $("#kreirajSporocilo").html("<span class='obvestil label " +
          "label-danger fade-in'>Napaka!</span>");
      }
		});
	}
}

/**
 * Za podan EHR ID preberi demografske podrobnosti pacienta in izpiši sporočilo
 * s pridobljenimi podatki (ime, priimek in datum rojstva).
 */
function preberiEHRodBolnika() {
	var ehrID = $("#preberiEHRid").val();
	if (!ehrID || ehrID.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "vrni/" + ehrID,
			type: "GET",
    	success: function (podatki) {
            var spolUporabnika = "";
            if (podatki.spol == "moskiSpol") {
                spolUporabnika = " (moški)";
            } else if (podatki.spol == "zenskiSpol") {
                spolUporabnika = " (ženska)";
            }
  			$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-info fade-in'>Uporabnik '" + podatki.ime + " " +
          podatki.priimek + spolUporabnika + "', rojen '" + podatki.datumRojstva +
          "'.</span>");
          $("#dodajVitalnoEHR").val(ehrID);
          $("#meritveVitalnihZnakovEHRid").val(ehrID);

          document.getElementById("vnosMeritevGumb").disabled = false;
          document.getElementById("pregledMeritevGumb").disabled = false;

  		},
  		error: function(err) {
  			$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-warning fade-in'>Napaka '" +
          JSON.parse(err.responseText).opis + "'!");
  		}
		});
	}
}

/**
 * Za dodajanje vitalnih znakov pacienta je pripravljena kompozicija, ki
 * vključuje množico meritev vitalnih znakov (EHR ID, datum in ura,
 * telesna višina, telesna teža, sistolični in diastolični krvni tlak,
 * nasičenost krvi s kisikom in merilec).
 */
function dodajMeritveVitalnihZnakov() {

    document.getElementById("verjetnostOkuzbePoljeZelena").style.display = "none";
    document.getElementById("verjetnostOkuzbePoljeRumena").style.display = "none";
    document.getElementById("verjetnostOkuzbePoljeRdeca").style.display = "none";

	var ehrID = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
    var obcutekGlavobola = $("input[name='glavobol']:checked").val();
    var obcutekVrocine = $("input[name='obcutekVrocine']:checked").val();
    var tezaveZDihanjem = $("input[name='tezaveZDihanjem']:checked").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
    var izpostavljenostVirusu = $("input[name='izpostavljenostVirusu']:checked").val();
	if (!ehrID || ehrID.trim().length == 0 ||
      !datumInUra || datumInUra.trim().length == 0 ||
      !telesnaVisina || telesnaVisina.trim().length == 0 ||
      !telesnaTeza || telesnaTeza.trim().length == 0 ||
      !telesnaTemperatura || telesnaTemperatura.trim().length == 0 ||
      (obcutekVrocine != 0 && obcutekVrocine != 1) || (tezaveZDihanjem != 0 && tezaveZDihanjem != 1) ||
      (obcutekGlavobola != 0 && obcutekGlavobola != 1) ||
      !nasicenostKrviSKisikom || nasicenostKrviSKisikom.trim().length == 0 ||
      (izpostavljenostVirusu != 0 && izpostavljenostVirusu != 1)
    ) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-danger fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {

        // verjetnost okuzbe uporabnika
        var verjetnostOkuzbe = izracunVerjetnostiOkuzbe(telesnaVisina, telesnaTeza, telesnaTemperatura, obcutekGlavobola, obcutekVrocine, tezaveZDihanjem, nasicenostKrviSKisikom, izpostavljenostVirusu);
        // dodajanje oznake:
        var verjetnostOkuzbeNapis;
        if (verjetnostOkuzbe <= 50) {
            verjetnostOkuzbeNapis = "Zelena";
        } else if (verjetnostOkuzbe <= 80) {
            verjetnostOkuzbeNapis = "Rumena";
        } else {
            verjetnostOkuzbeNapis = "Rdeca";
        }

    var podatki = {
      datumInUra: datumInUra,
      telesnaVisina: parseFloat(telesnaVisina),
      telesnaTeza: parseFloat(telesnaTeza),
      telesnaTemperatura: parseFloat(telesnaTemperatura),
      obcutekGlavobola: obcutekGlavobola,
      obcutekVrocine: obcutekVrocine,
      tezaveZDihanjem: tezaveZDihanjem,
      nasicenostKrviSKisikom: parseFloat(nasicenostKrviSKisikom),
      izpostavljenostVirusu: izpostavljenostVirusu,
      verjetnostOkuzbe: verjetnostOkuzbe
    };
		$.ajax({
      url: baseUrl + "azuriraj?kljuc=" + ehrID + "|meritve" + "&elementTabele=true",
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(podatki),
      success: function (odgovor) {
        $("#dodajMeritveVitalnihZnakovSporocilo").html(
          "<span class='obvestilo label label-success fade-in'>" +
          "Meritve za uporabnika " + ehrID + " uspešno dodane!" + ".</span>");

        $("#dodajVitalnoEHR").val("");
      	$("#dodajVitalnoDatumInUra").val("");
      	$("#dodajVitalnoTelesnaVisina").val("");
        $("#dodajVitalnoTelesnaTeza").val("");
      	$("#dodajVitalnoTelesnaTemperatura").val("");
        $("#" + (obcutekGlavobola == 1 ? "glavobolDa" : "glavobolNe")).prop('checked', false);
        $("#" + (obcutekVrocine == 1 ? "obcutekVrocineDa" : "obcutekVrocineNe")).prop('checked', false);
        $("#" + (tezaveZDihanjem == 1 ? "tezaveZDihanjemDa" : "tezaveZDihanjemNe")).prop('checked', false);
        $("#dodajVitalnoNasicenostKrviSKisikom").val("");
        $("#" + (izpostavljenostVirusu == 1 ? "izpostavljenostVirusuDa" : "izpostavljenostVirusuNe")).prop('checked', false);
        $("#meritveVitalnihZnakovEHRid").val(ehrID);
        $("#dodajVitalnoEHR").val(ehrID);

        // izpis izracunVerjetnosti
        document.getElementById("verjetnostOkuzbeVnesenihMeritev" + verjetnostOkuzbeNapis).innerHTML = verjetnostOkuzbe;
        document.getElementById("verjetnostOkuzbePolje" + verjetnostOkuzbeNapis).style.display = "";
        document.getElementById("pregledMeritev").style.display = "";
      },
      error: function(err) {
        $("#dodajMeritveVitalnihZnakovSporocilo").html(
          "<span class='obvestilo label label-danger fade-in'>Napaka!</span>");
      }
		});
	}
}

/**
 * Pridobivanje vseh zgodovinskih podatkov meritev izbranih vitalnih znakov
 * (telesna temperatura in telesna teža).
 */
function preberiMeritveVitalnihZnakov() {
	var ehrID = $("#meritveVitalnihZnakovEHRid").val();
	var tip = "Telesna temperatura";

	if (!ehrID || ehrID.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-danger fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
        uporabnikPodatki = [];
        uporabnikPodatkiID = "";
		$.ajax({
			url: baseUrl + "vrni/" + ehrID + "|" + "meritve",
	    	type: 'GET',
	    	success: function (podatki) {
          if (podatki.length > 0) {
              var povprecnaVrednostVerjetnostiOkuzbe = 0;
              var stevecPovprecneVrednosti = 0;
            var prikaz = "<table class='table table-striped " +
              "table-hover' style='font-weight: normal; margin-top:20px'><tr style='border-bottom: 3px solid gray;'><td>Datum in ura</td>" +
              "<td class='text-center'>Telesna temperatura</td><td class='text-center'>Izpostavljenost COVID-19</td>" +
              "<th class='text-right'>Verjetnost Okužbe</th></tr>";
            podatki.forEach(podatek => {
                povprecnaVrednostVerjetnostiOkuzbe += podatek.verjetnostOkuzbe;
                stevecPovprecneVrednosti ++;
                uporabnikPodatki.push(podatek.verjetnostOkuzbe);
              prikaz += "<tr><td>" + podatek.datumInUra +
                "</td><td class='text-center'>" + podatek.telesnaTemperatura + "°C"
                + "</td><td class='text-center'>" + (podatek.izpostavljenostVirusu == 0 ? "Ne" : "Da") + "</td><td class='text-right'>" +
                podatek.verjetnostOkuzbe + " " + "%" +
                "</td></tr>";
            });
            var barvaGumba;
            var verjetnostOkuzbeNapis;
            if (Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 <= 50) {
                verjetnostOkuzbeNapis = "zelena";
                barvaGumba = "success";
            } else if (Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 <= 80) {
                verjetnostOkuzbeNapis = "rumena";
                barvaGumba = "warning"
            } else {
                verjetnostOkuzbeNapis = "rdeca";
                barvaGumba = "danger";
            }

            prikaz += "<th colspan='4' class='text-center'>Povprečna vrednost okužbe: " +
            Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 + " %<img src='knjiznice/slike/" +
            verjetnostOkuzbeNapis + "Ikona.png' style='margin-left: 10px; height:23px; width: auto;'/></th>";

            prikaz += "</table>";

            // Dodajanje gumba za prikaz podatkov
            prikaz += '<button type="button" class="btn btn-' + barvaGumba + ' btn-xs btn-block" style="margin-top: 0.7em;" onclick="grafPodatkov()"><span class="lead" style="font-size: 1.3em;">Pikaži podatke</span></button>';

            $("#rezultatMeritveVitalnihZnakov").html(prikaz);
          } else {
            $("#preberiMeritveVitalnihZnakovSporocilo").html(
              "<span class='obvestilo label label-warning fade-in'>" +
              "Ni podatkov!</span>");
          }
          $("#preberiMeritveVitalnihZnakovSporocilo").html("");
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).opis + "'!");
	    	}
		});

	}
}

// funckija, ki doda uporanbike v seznam
function dodajUporabnikeBranjeEHR() {
    $.ajax({
        url: baseUrl + "vrni/vsi",
        type: "GET",
    success: function (podatki) {
        var prikazUporabnikov = "<select class='select-state form-control input-sm' id='preberiObstojeciEHR' placeholder='uporabnik'>" +
            "<option value='' selected disabled>Uporabnik</option>" +
            "<option value=" + arthurDentEHRID + " disabled>Arthur Dent</option>" +
            "<option value=" + fordPerfectEHRID + " disabled>Ford Perfect</option>" +
            "<option value=" + zaphodBeeblebroxEHRID + " disabled>Zaphod Beeblebrox</option>";
        for (var key of Object.keys(podatki)) {
            var kljucEHRID = (key == undefined ? "" : key);
            var imeUporabnika = (podatki[key].ime == undefined ? "" : podatki[key].ime);
            var priimekUporabnika = (podatki[key].priimek == undefined ? "" : podatki[key].priimek);
            //console.log(kljucEHRID, imeUporabnika, priimekUporabnika);

            prikazUporabnikov += "<option value='" + kljucEHRID + "'>" + imeUporabnika + " " + priimekUporabnika + "</option>";
        }
        prikazUporabnikov += "</select>";
        //console.log(prikazUporabnikov);
        $("#mnozicaUporabnikov").html(prikazUporabnikov);

        /**
        * Napolni testni EHR ID pri prebiranju EHR zapisa obstoječega bolnika,
        * ko uporabnik izbere vrednost iz padajočega menuja
        * (npr. Dejan Lavbič, Pujsa Pepa, Ata Smrk)
        */
        $('#preberiObstojeciEHR').change(function() {
            $("#preberiSporocilo").html("");
            $("#preberiEHRid").val($(this).val());
        });
    },
    error: function(err) {
        console.log("Napaka " + JSON.parse(err.responseText).opis + "!");
    }
    });
}

// funckija, ki prikaze izpis podatkov za arthurja denta
function preberiMeritveVitalnihZnakovTestneOsebeArthurDent() {
    uporabnikPodatki = [];
    uporabnikPodatkiID = "ArthurDent";
    var podatki = arthurDentPodatki;
    var povprecnaVrednostVerjetnostiOkuzbe = 0;
    var stevecPovprecneVrednosti = 0;
    var prikaz = "<table class='table table-striped " +
    "table-hover' style='font-weight: normal; margin-top:20px'><tr style='border-bottom: 3px solid gray;'><td>Datum in ura</td>" +
    "<td class='text-center'>Telesna temperatura</td><td class='text-center'>Izpostavljenost COVID-19</td>" +
    "<th class='text-right'>Verjetnost Okužbe</th></tr>";
    for (let i = 0; i < podatki.meritve.length; i++) {
        var podatek = podatki.meritve[i];
        povprecnaVrednostVerjetnostiOkuzbe += podatek.verjetnostOkuzbe;
        stevecPovprecneVrednosti ++;
        uporabnikPodatki.push(podatek.verjetnostOkuzbe);
        prikaz += "<tr><td>" + podatek.datumInUra +
        "</td><td class='text-center'>" + podatek.telesnaTemperatura + "°C"
        + "</td><td class='text-center'>" + (podatek.izpostavljenostVirusu == 0 ? "Ne" : "Da") + "</td><td class='text-right'>" +
        podatek.verjetnostOkuzbe + " " + "%" +
        "</td></tr>";
    };

    var verjetnostOkuzbeNapis;
    if (Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 <= 50) {
        verjetnostOkuzbeNapis = "zelena";
    } else if (Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 <= 80) {
        verjetnostOkuzbeNapis = "rumena";
    } else {
        verjetnostOkuzbeNapis = "rdeca";
    }

    prikaz += "<th colspan='4' class='text-center'>Povprečna vrednost okužbe: " +
    Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 + " %<img src='knjiznice/slike/" +
    verjetnostOkuzbeNapis + "Ikona.png' style='margin-left: 10px; height:23px; width: auto;'/></th>";

    prikaz += "</table>";

    grafPodatkov();

    $("#rezultatMeritveVitalnihZnakovArthurDent").html(prikaz);
    document.getElementById('skupinaGumbovZaIzbiroTestaArthurDent').disabled=true;
    document.getElementById('skupinaGumbovZaIzbiroTestaFordPerfect').disabled=false;
    document.getElementById('skupinaGumbovZaIzbiroTestaZahpodBeeblerox').disabled=false;
}

// funckija, ki prikaze izpis podatkov za forda perfecta
function preberiMeritveVitalnihZnakovTestneOsebeFordPerfect() {
    uporabnikPodatki = [];
    uporabnikPodatkiID = "FordPerfect";
    var podatki = fordPerfectPodatki;
    var povprecnaVrednostVerjetnostiOkuzbe = 0;
    var stevecPovprecneVrednosti = 0;
    var prikaz = "<table class='table table-striped " +
    "table-hover' style='font-weight: normal; margin-top:20px'><tr style='border-bottom: 3px solid gray;'><td>Datum in ura</td>" +
    "<td class='text-center'>Telesna temperatura</td><td class='text-center'>Izpostavljenost COVID-19</td>" +
    "<th class='text-right'>Verjetnost Okužbe</th></tr>";
    for (let i = 0; i < podatki.meritve.length; i++) {
        var podatek = podatki.meritve[i];
        povprecnaVrednostVerjetnostiOkuzbe += podatek.verjetnostOkuzbe;
        stevecPovprecneVrednosti ++;
        uporabnikPodatki.push(podatek.verjetnostOkuzbe);
        prikaz += "<tr><td>" + podatek.datumInUra +
        "</td><td class='text-center'>" + podatek.telesnaTemperatura + "°C"
        + "</td><td class='text-center'>" + (podatek.izpostavljenostVirusu == 0 ? "Ne" : "Da") + "</td><td class='text-right'>" +
        podatek.verjetnostOkuzbe + " " + "%" +
        "</td></tr>";
    };

    var verjetnostOkuzbeNapis;
    if (Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 <= 50) {
        verjetnostOkuzbeNapis = "zelena";
    } else if (Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 <= 80) {
        verjetnostOkuzbeNapis = "rumena";
    } else {
        verjetnostOkuzbeNapis = "rdeca";
    }

    prikaz += "<th colspan='4' class='text-center'>Povprečna vrednost okužbe: " +
    Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 + " %<img src='knjiznice/slike/" +
    verjetnostOkuzbeNapis + "Ikona.png' style='margin-left: 10px; height:23px; width: auto;'/></th>";

    prikaz += "</table>";

    grafPodatkov();

    $("#rezultatMeritveVitalnihZnakovFordPerfect").html(prikaz);
    document.getElementById('skupinaGumbovZaIzbiroTestaArthurDent').disabled=false;
    document.getElementById('skupinaGumbovZaIzbiroTestaFordPerfect').disabled=true;
    document.getElementById('skupinaGumbovZaIzbiroTestaZahpodBeeblerox').disabled=false;
}

// funckija, ki prikaze izpis podatkov za zaphod beeblebrox
function preberiMeritveVitalnihZnakovTestneOsebeZaphodBeeblerox() {
    uporabnikPodatki = [];
    uporabnikPodatkiID = "ZaphodBeeblebrox";
    var podatki = zaphodBeeblebroxPodatki;
    var povprecnaVrednostVerjetnostiOkuzbe = 0;
    var stevecPovprecneVrednosti = 0;
    var prikaz = "<table class='table table-striped " +
    "table-hover' style='font-weight: normal; margin-top:20px'><tr style='border-bottom: 3px solid gray;'><td>Datum in ura</td>" +
    "<td class='text-center'>Telesna temperatura</td><td class='text-center'>Izpostavljenost COVID-19</td>" +
    "<th class='text-right'>Verjetnost Okužbe</th></tr>";
    for (let i = 0; i < podatki.meritve.length; i++) {
        var podatek = podatki.meritve[i];
        povprecnaVrednostVerjetnostiOkuzbe += podatek.verjetnostOkuzbe;
        stevecPovprecneVrednosti ++;
        uporabnikPodatki.push(podatek.verjetnostOkuzbe);
        prikaz += "<tr><td>" + podatek.datumInUra +
        "</td><td class='text-center'>" + podatek.telesnaTemperatura + "°C"
        + "</td><td class='text-center'>" + (podatek.izpostavljenostVirusu == 0 ? "Ne" : "Da") + "</td><td class='text-right'>" +
        podatek.verjetnostOkuzbe + " " + "%" +
        "</td></tr>";
    };

    var verjetnostOkuzbeNapis;
    if (Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 <= 50) {
        verjetnostOkuzbeNapis = "zelena";
    } else if (Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 <= 80) {
        verjetnostOkuzbeNapis = "rumena";
    } else {
        verjetnostOkuzbeNapis = "rdeca";
    }

    prikaz += "<th colspan='4' class='text-center'>Povprečna vrednost okužbe: " +
    Math.round(povprecnaVrednostVerjetnostiOkuzbe/stevecPovprecneVrednosti * 100) / 100 + " %<img src='knjiznice/slike/" +
    verjetnostOkuzbeNapis + "Ikona.png' style='margin-left: 10px; height:23px; width: auto;'/></th>";

    prikaz += "</table>";

    grafPodatkov();

    $("#rezultatMeritveVitalnihZnakovZaphodBeeblerox").html(prikaz);
    document.getElementById('skupinaGumbovZaIzbiroTestaArthurDent').disabled=false;
    document.getElementById('skupinaGumbovZaIzbiroTestaFordPerfect').disabled=false;
    document.getElementById('skupinaGumbovZaIzbiroTestaZahpodBeeblerox').disabled=true;
}

// funkcija, ki izracuna verjetnost okuzbe
function izracunVerjetnostiOkuzbe(telesnaVisina, telesnaTeza, telesnaTemperatura, obcutekGlavobola, obcutekVrocine, tezaveZDihanjem, nasicenostKrviSKisikom, izpostavljenostVirusu) {
// verjetnost okuzbe bomo izracunali po formuli
    var verjetnostOkuzbe = ((parseInt(telesnaVisina) + parseInt(telesnaTeza)) / 300 + parseInt(telesnaTemperatura) * 15 + parseInt(obcutekGlavobola) * 150 + parseInt(obcutekVrocine) * 250 + parseInt(tezaveZDihanjem) * 300 + (100 - parseInt(nasicenostKrviSKisikom) * 0.01) + parseInt(izpostavljenostVirusu) * 500) / 18.7;

    verjetnostOkuzbe = Math.round(verjetnostOkuzbe * 100) / 100;
    verjetnostOkuzbe = (verjetnostOkuzbe >= 100 ? 100 : verjetnostOkuzbe);

    return verjetnostOkuzbe;
}

// funckija, ki prikaze podatke za slo in svet
function grafPodatkov() {
    var povprecjeVrednosti = [];
    var steviloMeritev = [];
    var vsotaPovprecij = 0;
    var barva1;
    var barva2;
    for (let i = 0; i < uporabnikPodatki.length; i++) {
        vsotaPovprecij += uporabnikPodatki[i];
        steviloMeritev.push(i+1 + ".");
    }
    var povprecje = vsotaPovprecij / uporabnikPodatki.length;

    for (let i = 0; i < uporabnikPodatki.length; i++) {
        povprecjeVrednosti.push(povprecje);
    }
    if (povprecje <= 50) {
        barva1 = "rgba(75, 195, 92, 1)";
        barva2 = "rgba(75, 195, 92, 0.35)";
    } else if (povprecje <= 80) {
        barva1 = "rgba(255, 206, 106, 1)";
        barva2 = "rgba(255, 206, 106, 0.35)";
    } else {
        barva1 = "rgba(255, 89, 82, 1)";
        barva2 = "rgba(255, 89, 82, 0.35)";
    }

    var prikaz = 'grafPrikazPodatkov' + uporabnikPodatkiID
    const ctx = document.getElementById(prikaz).getContext('2d');
    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: steviloMeritev,
            datasets: [
                {
                    label: "Verjetnost okuženosti",
                    fill: false,
                    lineTension: 0.25,
                    borderColor: barva1,
                    borderCapStyle: 'butt',
                    borderJoinStyle: 'miter',
                    pointRadius: 1,
                    borderWidth: 3,
                    data: uporabnikPodatki,

                },
                {
                    label: "Povprečje verjetnosti okužbe",
                    fill: false,
                    borderColor: barva2,
                    borderCapStyle: 'butt',
                    borderJoinStyle: 'miter',
                    pointRadius: 1,
                    borderWidth: 5,
                    data: povprecjeVrednosti,
                }
            ]
        },
        options: {
            legend: {
                display: true,
                position: 'top'
            },
            scales: { yAxes: [{ ticks: { beginAtZero: false } }] },
        }
    });

    if(uporabnikPodatkiID == "ArthurDent" || uporabnikPodatkiID == "FordPerfect" || uporabnikPodatkiID == "ZaphodBeeblebrox") {
        document.getElementById(prikaz).style.display = "";
    } else {
        document.getElementById("prikazPodatkov").style.display = "";
    }
}

// funkcija, ki pridobi podatke iz COVID-19 sledilnik
function pridobiPodatkeDanes() {
    var vsiOpravljeniTesti;
    var okuzeneOsebe;
    var okuzeneOsebeDanes;
    var ozdraveleOsebe;
    var umrli;

    var dan;
    var mesec;

    $.ajax({
        url: "https://api.sledilnik.org/api/stats",
        type: "GET",
    success: function (podatki) {
        var data = podatki[podatki.length - 2];
        vsiOpravljeniTesti = data.performedTestsToDate;
        okuzeneOsebe = data.cases.confirmedToDate;
        okuzeneOsebeDanes = data.cases.confirmedToday;
        ozdraveleOsebe = data.cases.recoveredToDate;
        umrli = data.statePerTreatment.deceasedToDate;

        var stil = "";
        if (okuzeneOsebeDanes <= 0) {
            okuzeneOsebeDanes = ""
        } else {
            okuzeneOsebeDanes = "+" + okuzeneOsebeDanes
            stil = "rgba(204, 41, 0, 0.7)"
        }

        dan = data.day;
        mesec = data.month;

        var datum = dan + ". ";
        switch (mesec) {
            case 1:
                datum += "januar";
                break;
            case 2:
                datum += "februar";
                break;
            case 3:
                datum += "marec";
                break;
            case 4:
                datum += "april";
                break;
            case 5:
                datum += "maj";
                break;
            case 6:
                datum += "junij";
                break;
            case 7:
                datum += "julij";
                break;
            case 8:
                datum += "avgust";
                break;
            case 9:
                datum += "september";
                break;
            case 10:
                datum += "oktober";
                break;
            case 11:
                datum += "november";
                break;
            case 12:
                datum += "december";
                break;

        }

        document.getElementById("steviloIzvedenihTestov").innerHTML = vsiOpravljeniTesti;
        document.getElementById("steviloPotrjenihOkuzb").innerHTML = okuzeneOsebe;
        document.getElementById("steviloPotrjenihOkuzbDanes").innerHTML = okuzeneOsebeDanes;
        document.getElementById("steviloPotrjenihOkuzbDanes").style.color = stil;
        document.getElementById("steviloPrebolelih").innerHTML = ozdraveleOsebe;
        document.getElementById("steviloUmrlih").innerHTML = umrli;
        document.getElementById("casPosodobitvePodatkov").innerHTML = "Nazadnje posodobljeno: " + datum;
    },
    error: function(err) {
        console.log("Napaka!");
    }
    });
}

/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke() {
    prikazPodatkovArthurDent();
    prikazPodatkovFordPerfect();
    prikazPodatkovZaphodBeeblerox();

    document.getElementById("navodilaZaUporabo").style.display = "none";
    document.getElementById("zacetnaGumba").style.display = "none";
    document.getElementById("statistika").style.display = "none";
    document.getElementById("skupinaGumbovZaIzbiroTesta").style.display = "none";

}


// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija

// ZEMLJEVID
// funkcija, ki nacentrira zemljevid na uporabnikovo lokacijo
function centerUporabnik () {
    console.log("Funkcija 'centerUporabnik' se je izvedla");

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            console.log("Geolocation is not supported by this browser.");
            window.alert("Geolocation is not supported by this browser.");
        }
    }

    function showPosition(position) {
        console.log("Latitude: " + position.coords.latitude + "\nLongitude: " + position.coords.longitude);
        setUsersLocation(position.coords.latitude, position.coords.longitude);
    }

    function showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                console.log("User denied the request for Geolocation.");
                break;
            case error.POSITION_UNAVAILABLE:
                console.log("Location information is unavailable.");
                break;
            case error.TIMEOUT:
                console.log("The request to get user location timed out.");
                break;
            case error.UNKNOWN_ERROR:
                console.log("An unknown error occurred.");
                break;
        }
    }

    // Dejanski klic funkcije za iskanje lokacije
    getLocation();
};

// Priblizamo se na lokacijo uporabnika
function setUsersLocation (lat, lng) {
    uporabnikLAT = Math.round(lat * 1000000) / 1000000;
    uporabnikLNG = Math.round(lng * 1000000) / 1000000;

    prvicMove = false;
    odstraniVseTockeNaZemljevidu();
    prikaziVseBolnisnice()
    map.flyTo(new L.LatLng(uporabnikLAT, uporabnikLNG), 15);
    dodajMarker(uporabnikLAT, uporabnikLNG, "LOKACIJA", "uporabnik");
}

// funkcija, ki prikaze vse bolnice glede na oddaljenost
function prikaziVseBolnisnice() {

    // Najblizja bolninica
    najmanjsaRazdalja = Number.MAX_SAFE_INTEGER;

    var urgentniCenter = document.getElementById("urgentniCenter").checked;
    var neurgentniCenter = document.getElementById("neurgentniCenter").checked;
    var ostalo = document.getElementById("ostalo").checked;

    $.getJSON("./knjiznice/json/bolnisnice.json", function(data) {

        for (let i = 0; i < data.features.length; i++) {

            // prikaz je Point
            if (data.features[i].geometry.type == "Point") {
                // modra znacka
                var tipBolnice = "ostalo";

                // Objekt koncne tocke
                var koncnaTocka = L.latLng(data.features[i].geometry.coordinates[1], data.features[i].geometry.coordinates[0]);
                var razdalja = makeUporabnik.getLatLng().distanceTo(koncnaTocka).toFixed(0)/1000;

                // Poiscemo najmanjse razdalje
                if (razdalja <= razdaljaBolnisnicOdTocke && data.features[i].properties.emergency == "yes" && urgentniCenter == true) {
                    tipBolnice = "urgentniCenter";
                } else if (razdalja <= razdaljaBolnisnicOdTocke && neurgentniCenter == true) {
                    tipBolnice = "neurgentniCenter";
                }

                var opis = (data.features[i].properties.name || "") + "<br>" +
                       (data.features[i].properties["addr:street"] || "") + " " +
                       (data.features[i].properties["addr:housenumber"] || "");

                if (data.features[i].properties["addr:city"] != "" && data.features[i].properties["addr:city"] != undefined) {
                    if (opis.trim() != (data.features[i].properties.name || "") + "<br>") {
                        opis += ", ";
                    }
                    opis += data.features[i].properties["addr:city"];
                } else {
                    opis += "";
                }

                if (opis.trim() == "<br>") {
                    opis = "<img src='https://image.flaticon.com/icons/png/512/2830/2830298.png' style='height: 25px; width: auto;'/>";
                } else {
                    opis += "<img src='https://image.flaticon.com/icons/svg/179/179571.svg' style='margin-left: 3px; margin-top: 3px; dispaly: inline-flex; height: 20px; width: auto;'/>"
                }

                // Preverimo, ce je razdalja najmanjsa
                if (razdalja < najmanjsaRazdalja) {
                    najmanjsaRazdalja = razdalja;
                    najblizjaBolnisnica = data.features[i];
                    opisNajblizjeBolnisnice = opis;
                }

                // Prikaz markerjev
                dodajMarker(data.features[i].geometry.coordinates[1], data.features[i].geometry.coordinates[0], opis, tipBolnice);
            }

            // prikaz je LineString
            else if (data.features[i].geometry.type == "LineString") {
                // modra znacka
                var tipBolnice = "ostalo";
                var barva = "blue";

                // Objekt koncne tocke
                var koncnaTocka = L.latLng(data.features[i].geometry.coordinates[0][1], data.features[i].geometry.coordinates[0][0]);
                var razdalja = makeUporabnik.getLatLng().distanceTo(koncnaTocka).toFixed(0)/1000;

                // Poiscemo najmanjse razdalje
                if (razdalja <= razdaljaBolnisnicOdTocke && data.features[i].properties.emergency == "yes" && urgentniCenter == true) {
                    tipBolnice = "urgentniCenter";
                    barva = "green";
                } else if (razdalja <= razdaljaBolnisnicOdTocke && neurgentniCenter == true) {
                    tipBolnice = "neurgentniCenter";
                    barva = "yellow";
                }

                var opis = (data.features[i].properties.name || "") + "<br>" +
                       (data.features[i].properties["addr:street"] || "") + " " +
                       (data.features[i].properties["addr:housenumber"] || "");

                if (data.features[i].properties["addr:city"] != "" && data.features[i].properties["addr:city"] != undefined) {
                    if (opis.trim() != (data.features[i].properties.name || "") + "<br>") {
                        opis += ", ";
                    }
                    opis += data.features[i].properties["addr:city"];
                } else {
                    opis += "";
                }

                if (opis.trim() == "<br>") {
                    opis = "<img src='https://image.flaticon.com/icons/png/512/2830/2830298.png' style='height: 25px; width: auto;'/>";
                } else {
                    opis += "<img src='https://image.flaticon.com/icons/svg/179/179571.svg' style='margin-left: 3px; margin-top: 3px; dispaly: inline-flex; height: 20px; width: auto;'/>"
                }

                // Preverimo, ce je razdalja najmanjsa
                if (razdalja < najmanjsaRazdalja) {
                    najmanjsaRazdalja = razdalja;
                    najblizjaBolnisnica = data.features[i];
                    opisNajblizjeBolnisnice = opis;
                }

                // Prikaz markerjev
                dodajMarker(data.features[i].geometry.coordinates[0][1], data.features[i].geometry.coordinates[0][0], opis, tipBolnice);

                var stil = {
                    "color": barva,
                    "weight": 5,
                    "opacity": 0.5
                };

                // Narisemo lik na zemljevid
                var lineString = data.features[i].geometry;
                geoPolygon[i] = L.geoJSON(lineString, {style: stil});
                geoPolygon[i].addTo(map);
            }

            // Prikaz Polygon
            else {
                // modra znacka
                var tipBolnice = "ostalo";

                var barva = "blue";

                // Objekt koncne tocke
                var koncnaTocka = L.latLng(data.features[i].geometry.coordinates[0][0][1], data.features[i].geometry.coordinates[0][0][0]);
                var razdalja = makeUporabnik.getLatLng().distanceTo(koncnaTocka).toFixed(0)/1000;

                // Poiscemo najmanjse razdalje
                if (razdalja <= razdaljaBolnisnicOdTocke && data.features[i].properties.emergency == "yes" && urgentniCenter == true) {
                    tipBolnice = "urgentniCenter";
                    barva = "green";
                } else if (razdalja <= razdaljaBolnisnicOdTocke && neurgentniCenter == true) {
                    tipBolnice = "neurgentniCenter";
                    barva = "yellow";
                }

                var opis = (data.features[i].properties.name || "") + "<br>" +
                       (data.features[i].properties["addr:street"] || "") + " " +
                       (data.features[i].properties["addr:housenumber"] || "");

                if (data.features[i].properties["addr:city"] != "" && data.features[i].properties["addr:city"] != undefined) {
                    if (opis.trim() != (data.features[i].properties.name || "") + "<br>") {
                        opis += ", ";
                    }
                    opis += data.features[i].properties["addr:city"];
                } else {
                    opis += "";
                }

                if (opis.trim() == "<br>") {
                    opis = "<img src='https://image.flaticon.com/icons/png/512/2830/2830298.png' style='height: 25px; width: auto;'/>";
                } else {
                    opis += "<img src='https://image.flaticon.com/icons/svg/179/179571.svg' style='margin-left: 3px; margin-top: 3px; dispaly: inline-flex; height: 20px; width: auto;'/>"
                }

                // Preverimo, ce je razdalja najmanjsa
                if (razdalja < najmanjsaRazdalja) {
                    najmanjsaRazdalja = razdalja;
                    najblizjaBolnisnica = data.features[i];
                    opisNajblizjeBolnisnice = opis;
                }

                // Prikaz markerjev
                dodajMarker(data.features[i].geometry.coordinates[0][0][1], data.features[i].geometry.coordinates[0][0][0], opis, tipBolnice);

                var polygon = {
                    "type": "Feature",
                    "properties": {
                      "name": data.features[i].properties.name,
                      "popupContent": "This is where the Rockies play!",
                    },
                    "geometry": {
                      "type": "Polygon",
                      "coordinates": data.features[i].geometry.coordinates,
                    }
                };

                var stil = {
                    "color": barva,
                    "weight": 5,
                    "opacity": 0.5
                };

                geoPolygon[i] = L.geoJSON(polygon, {style: stil});
                geoPolygon[i].addTo(map);

            }

        }

        if (najblizjaBolnisnica.geometry.type == "Point") {
            dodajMarker(najblizjaBolnisnica.geometry.coordinates[1], najblizjaBolnisnica.geometry.coordinates[0], opisNajblizjeBolnisnice, "najblizja");
        } else if (najblizjaBolnisnica.geometry.type == "LineString") {
            dodajMarker(najblizjaBolnisnica.geometry.coordinates[0][1], najblizjaBolnisnica.geometry.coordinates[0][0], opisNajblizjeBolnisnice, "najblizja");
        } else {
            dodajMarker(najblizjaBolnisnica.geometry.coordinates[0][0][1], najblizjaBolnisnica.geometry.coordinates[0][0][0], opisNajblizjeBolnisnice, "najblizja");
        }
        prikazNajblizjebolnisnice();
    });
}

// Funkcija, ki prikaze najblizju bolnisnco

function prikazNajblizjebolnisnice() {

    var imeBolnisnice = najblizjaBolnisnica.properties.name;

    var naslovBolnisnice = (najblizjaBolnisnica.properties["addr:street"] || "") + " " +
           (najblizjaBolnisnica.properties["addr:housenumber"] || "");

    if (najblizjaBolnisnica.properties["addr:city"] != "" && najblizjaBolnisnica.properties["addr:city"] != undefined) {
        if (naslovBolnisnice.trim() != "") {
            naslovBolnisnice += ", ";
        }
        naslovBolnisnice += najblizjaBolnisnica.properties["addr:city"];
    } else {
        naslovBolnisnice += "";
    }

    if (najblizjaBolnisnica.properties["addr:postcode"] == undefined || najblizjaBolnisnica.properties["addr:postcode"] == "") {
        naslovBolnisnice += "";
    } else {
        naslovBolnisnice += " (" + najblizjaBolnisnica.properties["addr:postcode"] + ")";
    }

    if (naslovBolnisnice.trim() == "") {
        document.getElementById("naslovBolnisnice").innerHTML = "***";
    } else {
        document.getElementById("naslovBolnisnice").innerHTML = naslovBolnisnice;
    }

    if (imeBolnisnice == undefined || imeBolnisnice.trim() == "") {
            document.getElementById("imeBolnisnice").innerHTML = "***";
    } else {
        document.getElementById("imeBolnisnice").innerHTML = imeBolnisnice;
    }

    if (najblizjaBolnisnica.properties["contact:phone"] == undefined && najblizjaBolnisnica.phone != undefined) {
        document.getElementById("telefonBolnisnice").innerHTML = najblizjaBolnisnica.properties.phone;
    } else if (najblizjaBolnisnica.properties["contact:phone"] != undefined && najblizjaBolnisnica.phone == undefined) {
        document.getElementById("telefonBolnisnice").innerHTML = najblizjaBolnisnica.properties["contact:phone"];
    } else {
        document.getElementById("telefonBolnisnice").innerHTML = "***";
    }

}


// Funkcija, ki pobrise zemljevid
function odstraniVseTockeNaZemljevidu() {
    prvicMove = false;
    // Izbrisemo VSE oznake na zemljevidu
    for (let i = 0; i < geoPolygon.length; i++) {
        map.removeLayer(geoPolygon[i]);
    }

    // Izbrisemo trenutno tocko uporabnika
    if (makeUporabnik) {
        map.removeLayer(makeUporabnik);
    }

    // Izbrisemo VSE markerje na zemljvidu
    for (var i = 0; i < markerji.length; i++) {
        map.removeLayer(markerji[i]);
    }

    map.flyTo(new L.LatLng(uporabnikLAT, uporabnikLNG), 9);

    // Ponastavimo checkbox
    document.getElementById("urgentniCenter").checked = false;
    document.getElementById("neurgentniCenter").checked = false;
    document.getElementById("ostalo").checked = false;
}

// Funckija, ki prikaze marker
function dodajMarker(lat, lng, opis, tip, prikaziMarker) {
  var markerOznaka = "./knjiznice/slike/";
  switch (tip) {
      case "uporabnik":
          markerOznaka += "marker.png";
          break;
      case "urgentniCenter":
          markerOznaka += "markerZelen.png";
          break;
      case "neurgentniCenter":
          markerOznaka += "markerRumen.png";
          break;
      case "ostalo":
          markerOznaka += "markerModer.png";
          break;
      case "najblizja":
          markerOznaka += "markerOranzen.png";
          break;
  }
  var ikona = new L.Icon({
    iconUrl: markerOznaka,
    shadowUrl: './knjiznice/slike/markerSenca.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Ustvarimo marker z vhodnima podatkoma koordinat
  // in barvo ikone, glede na tip
  var marker = L.marker([lat, lng], {icon: ikona});

  var slika = "";
  // Uporabniku dodamo sliko
  if (opis === "LOKACIJA" && tip === "uporabnik") {
      slika = "<img src='https://www.flaticon.com/premium-icon/icons/svg/2894/2894805.svg' style='margin-left: 3px; display: inline-flex; height: 23px; width: auto;'/>";
  } else if (opis === "FAKULTETA ZA RAČUNALNIŠTVO IN INFORMATIKO" && tip === "uporabnik") {
      slika = "<img src='https://image.flaticon.com/icons/svg/1344/1344761.svg' style='margin-right: 3px; display: inline-flex; height: 18px; width: auto;'/>"
  }

  if (opis === "FAKULTETA ZA RAČUNALNIŠTVO IN INFORMATIKO" && tip === "uporabnik") {
      // Izpišemo želeno sporočilo v oblaček
      marker.bindPopup("<div>" + "<span>" + slika + "   " + opis + "</span>" + "</div>").openPopup();
  } else if (opis === "LOKACIJA" && tip === "uporabnik") {
      // Izpišemo želeno sporočilo v oblaček
      marker.bindPopup("<div>" + "<span>" + opis + slika + "</span>" + "</div>").openPopup();
  } else {
      marker.bindPopup("<div>" + opis + "</div>").openPopup();
  }

  // Dodamo točko na mapo in v seznam
  if (prikaziMarker == undefined || prikaziMarker) {
    marker.addTo(map);
  }

  markerji.push(marker);

}

// funkcija, ki prikaze cas
function prikazDatumaInCasa() {
    var datum = new Date();

    var leto = datum.getFullYear();
    var mesec = datum.getMonth() + 1;
    var dan = datum.getDate();
    var ura = datum.getHours();
    var minuta = datum.getMinutes();

    var cas = leto + "-" + mesec + "-" + dan + "T" + ura + ":" + minuta + "Z";
    document.getElementById("dodajVitalnoDatumInUra").value = cas;

}

// Podatki uporabnikov
var arthurDentPodatki = {
  "ime": "Arthur ",
  "priimek": "Dent",
  "spol": "moskiSpol",
  "datumRojstva": "1972-12-24",
  "meritve": [
    {
      "datumInUra": "2020-5-18T1:45Z",
      "telesnaVisina": 183,
      "telesnaTeza": 89.34,
      "telesnaTemperatura": 36.7,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 99,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 34.22
    },
    {
      "datumInUra": "2020-5-18T1:46Z",
      "telesnaVisina": 184,
      "telesnaTeza": 88.7,
      "telesnaTemperatura": 37.1,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 98,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 43.04
    },
    {
      "datumInUra": "2020-5-18T1:47Z",
      "telesnaVisina": 183,
      "telesnaTeza": 88.1,
      "telesnaTemperatura": 37,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 97,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 48.39
    },
    {
      "datumInUra": "2020-5-18T1:48Z",
      "telesnaVisina": 182,
      "telesnaTeza": 90.09,
      "telesnaTemperatura": 36.91,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 96,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 42.24
    },
    {
      "datumInUra": "2020-5-18T1:52Z",
      "telesnaVisina": 182,
      "telesnaTeza": 88.1,
      "telesnaTemperatura": 36.32,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 99,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 34.22
    },
    {
      "datumInUra": "2020-5-18T1:52Z",
      "telesnaVisina": 183,
      "telesnaTeza": 87.52,
      "telesnaTemperatura": 36.81,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 98,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 34.22
    },
    {
      "datumInUra": "2020-5-18T1:53Z",
      "telesnaVisina": 185,
      "telesnaTeza": 88.98,
      "telesnaTemperatura": 37.2,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 95,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 56.41
    },
    {
      "datumInUra": "2020-5-18T1:53Z",
      "telesnaVisina": 182,
      "telesnaTeza": 84,
      "telesnaTemperatura": 36.2,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 99,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 42.24
    },
    {
      "datumInUra": "2020-5-18T1:54Z",
      "telesnaVisina": 181,
      "telesnaTeza": 84.9,
      "telesnaTemperatura": 36.4,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 99,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 34.22
    },
    {
      "datumInUra": "2020-5-18T1:55Z",
      "telesnaVisina": 184,
      "telesnaTeza": 91.3,
      "telesnaTemperatura": 36.3,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 99,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 47.59
    }
  ]
}

var fordPerfectPodatki = {
  "ime": "Ford",
  "priimek": "Perfect",
  "spol": "zenskiSpol",
  "datumRojstva": "2000-3-14",
  "meritve": [
    {
      "datumInUra": "2020-5-18T1:57Z",
      "telesnaVisina": 172,
      "telesnaTeza": 68,
      "telesnaTemperatura": 37.3,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 99,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 56.41
    },
    {
      "datumInUra": "2020-5-18T1:57Z",
      "telesnaVisina": 170,
      "telesnaTeza": 66.3,
      "telesnaTemperatura": 37.4,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 97,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 35.02
    },
    {
      "datumInUra": "2020-5-18T1:58Z",
      "telesnaVisina": 169,
      "telesnaTeza": 72,
      "telesnaTemperatura": 38.01,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 98,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 43.84
    },
    {
      "datumInUra": "2020-5-18T1:58Z",
      "telesnaVisina": 170,
      "telesnaTeza": 65.3,
      "telesnaTemperatura": 37.2,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 98,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 61.75
    },
    {
      "datumInUra": "2020-5-18T1:59Z",
      "telesnaVisina": 171,
      "telesnaTeza": 68.2,
      "telesnaTemperatura": 38.2,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 97,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 73.25
    },
    {
      "datumInUra": "2020-5-18T1:59Z",
      "telesnaVisina": 171,
      "telesnaTeza": 67,
      "telesnaTemperatura": 38.5,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 99,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 83.95
    },
    {
      "datumInUra": "2020-5-18T2:0Z",
      "telesnaVisina": 169,
      "telesnaTeza": 73,
      "telesnaTemperatura": 37.2,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 97,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 91.17
    },
    {
      "datumInUra": "2020-5-18T2:1Z",
      "telesnaVisina": 171,
      "telesnaTeza": 68.3,
      "telesnaTemperatura": 36.1,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "0",
      "nasicenostKrviSKisikom": 93,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 42.24
    },
    {
      "datumInUra": "2020-5-18T2:1Z",
      "telesnaVisina": 170,
      "telesnaTeza": 72.01,
      "telesnaTemperatura": 37.8,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 95,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 77.8
    },
    {
      "datumInUra": "2020-5-18T2:2Z",
      "telesnaVisina": 172,
      "telesnaTeza": 68.4,
      "telesnaTemperatura": 38.2,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 97,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 73.25
    }
  ]
}

var zaphodBeeblebroxPodatki = {
  "ime": "Zaphod",
  "priimek": "Beeblebrox",
  "spol": "ostalo",
  "datumRojstva": "1949-5-9",
  "meritve": [
    {
      "datumInUra": "2020-5-18T2:5Z",
      "telesnaVisina": 198,
      "telesnaTeza": 102.4,
      "telesnaTemperatura": 39.8,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "0",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 91,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 60.7
    },
    {
      "datumInUra": "2020-5-18T2:7Z",
      "telesnaVisina": 201.2,
      "telesnaTeza": 107.8,
      "telesnaTemperatura": 37.9,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 91,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 99.2
    },
    {
      "datumInUra": "2020-5-18T2:7Z",
      "telesnaVisina": 202.7,
      "telesnaTeza": 104.5,
      "telesnaTemperatura": 40.3,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 89,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 74.87
    },
    {
      "datumInUra": "2020-5-18T2:8Z",
      "telesnaVisina": 208.1,
      "telesnaTeza": 103.9,
      "telesnaTemperatura": 36.8,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 86,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 98.41
    },
    {
      "datumInUra": "2020-5-18T2:8Z",
      "telesnaVisina": 202.9,
      "telesnaTeza": 105.8,
      "telesnaTemperatura": 42.8,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 93,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 95.19
    },
    {
      "datumInUra": "2020-5-18T2:9Z",
      "telesnaVisina": 207,
      "telesnaTeza": 109.2,
      "telesnaTemperatura": 35.7,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 99,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 97.6
    },
    {
      "datumInUra": "2020-5-18T2:10Z",
      "telesnaVisina": 201.7,
      "telesnaTeza": 99.79,
      "telesnaTemperatura": 39.8,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 97,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 74.07
    },
    {
      "datumInUra": "2020-5-18T2:11Z",
      "telesnaVisina": 201.9,
      "telesnaTeza": 109.1,
      "telesnaTemperatura": 40.9,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 99,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 100
    },
    {
      "datumInUra": "2020-5-18T2:12Z",
      "telesnaVisina": 201.3,
      "telesnaTeza": 107.9,
      "telesnaTemperatura": 37.8,
      "obcutekGlavobola": "0",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 91,
      "izpostavljenostVirusu": "1",
      "verjetnostOkuzbe": 91.18
    },
    {
      "datumInUra": "2020-5-18T2:12Z",
      "telesnaVisina": 208.2,
      "telesnaTeza": 110.1,
      "telesnaTemperatura": 36.78,
      "obcutekGlavobola": "1",
      "obcutekVrocine": "1",
      "tezaveZDihanjem": "1",
      "nasicenostKrviSKisikom": 97,
      "izpostavljenostVirusu": "0",
      "verjetnostOkuzbe": 71.66
    }
  ]
}
