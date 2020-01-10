let lineMargin = 0;
let sortedWordsByLabel, numWords;

function setup() {

  // Parameters
  data = JSON.parse(document.getElementById('data').textContent);
  console.log(Object.keys(data));
  // wordColors = ['#ff4000', '#ffbf00', '#ffff00', '#40ff00' ,'#00ffff', '#0080ff', '#0000ff', '#2E2B5F', '#8000ff', '#ff00ff'];
  wordColors = [
    [255, 64, 0],
    [255, 191, 0],
    [255, 255, 0],
    [64, 255, 0],
    [0, 255, 255],
    [0, 128, 255],
    [0, 0, 255],
    [46, 43, 95],
    [128, 0, 255],
    [255, 0, 255]
  ];
  
  wordFilterSlider = createSlider(10, 100, 20, 1);
  wordFilterSlider.position(10, 300);

  word_belong_threshold = 4;

  // Init data structures
  sortedWordsByLabelOriginal = sortWordsByLabels(data.words, data.word_labels);
  sortedUsersByLabel = sortUsersByLabels(data.users, data.user_labels, data.followers);
  aggregatedFollowersCount = getTotalFollowersPerLabels();
  wordBelongness = getWordBelongness(data.words, data.user_words, data.user_labels, word_belong_threshold);


}

function getRGBA(colorIndex, alpha = 1) {
  rgb = wordColors[colorIndex];

  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function draw() {
  
  sortedWordsByLabel = filterNumberOfWords(wordFilterSlider.value())
  numWords = sortedWordsByLabel.length;
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  createCanvas(canvasWidth, canvasHeight + 30);
  background(240);
  
  textSize(16)
  noStroke()
  fill("black")
  let title = 'Scroll to modify the number of words'
  text(title, textWidth(title)/2 + 10, 30)
  
  noStroke();
  strokeWeight(1);
  fill('white');
  centerX = canvasWidth / 2;
  centerY = canvasHeight / 2 + 30;
  radius = min(canvasWidth, canvasHeight) / 2 - 50;
  epsilon = 3;
  communityMargin = radius / 3.5;
  communityRadiusMin = radius / 7;
  communityRadiusMax = radius / 4;
  circle(centerX, centerY, radius * 2);
  drawWords();
  let wordCommunityBoundaries = drawWordCommunities();
  communityCenters = drawInfluencerCommunities(wordCommunityBoundaries);
  drawWordBelongness();
  drawTopInfluencers();
}

function sortWordsByLabels(words, labels) {
  let sortedWords = [];
  for (let i = 0; i < words.length; i++) {
    sortedWords.push({
      "word": words[i],
      "label": labels[i]
    })
  }

  sortedWords.sort(function(a, b) {
    return (a.label < b.label ? -1 : ((a.label == b.label) ? 0 : 1))
  })

  return sortedWords;
}

function sortUsersByLabels(users, labels, followers) {

  let sortedUsers = new Array(10);
  for (let i = 0; i < sortedUsers.length; i++) {
    sortedUsers[i] = [];
  }

  for (let i = 0; i < users.length; i++) {
    sortedUsers[labels[i]].push({
      "user": users[i],
      "followers": followers[i]
    })
  }

  Object.keys(sortedUsers).forEach(label => {
    sortedUsers[label].sort(function(a, b) {
      if (a.label < b.label) return -1;
      else if ((a.label == b.label) && (a.followers > b.followers)) return -1;
      else if ((a.label == b.label) && (a.followers < b.followers)) return 1;
      else if ((a.label == b.label) && (a.followers == b.followers)) return 0;
      else return 1;
    })
  })

  return sortedUsers;
}

function getTotalFollowersPerLabels() {
  let previousLabel = -1;
  let aggregatedFollowersCount = [];

  Object.keys(sortedUsersByLabel).forEach(label => {
    aggregatedFollowersCount[label] = 0;
    for (let i = 0; i < sortedUsersByLabel[label].length; i++) {
      let followers = sortedUsersByLabel[label][i].followers;
      aggregatedFollowersCount[label] += followers;
    }
  })
  return aggregatedFollowersCount;
}

function getWordBelongness(words, userWords, userLabels, threshold) {
  let wordBelongness = {};
  for (let i = 0; i < words.length; i++) {
    wordBelongness[words[i]] = {};
    for (let j = 0; j < userLabels.length; j++) {
      for (let k = 0; k < userWords[j].length; k++) {
        if (words[i] === userWords[j][k]) {
          if (!wordBelongness[words[i]].hasOwnProperty(userLabels[j])) {
            wordBelongness[words[i]][userLabels[j]] = 0;
          }
          wordBelongness[words[i]][userLabels[j]] += 1;
        }
      }
    }
  }

  // Filter words by a threshold
  Object.keys(wordBelongness).forEach(word => {
    let filteredWordBelong = new Set();
    Object.keys(wordBelongness[word]).forEach(community => {
      if (wordBelongness[word][community] >= threshold) {
        filteredWordBelong.add(community);
      }
    })
    wordBelongness[word] = filteredWordBelong;
  })

  return wordBelongness;
}

function drawWords() {
  strokeWeight(1);
  for (let i = 0; i <= 360; i += 360 / numWords) {
    let x1 = (radius + epsilon) * cos(radians(i)) + centerX;
    let y1 = (radius + epsilon) * sin(radians(i)) + centerY;
    let x2 = (radius - epsilon) * cos(radians(i)) + centerX;
    let y2 = (radius - epsilon) * sin(radians(i)) + centerY;
    let wordLabel = sortedWordsByLabel[int(i / (360 / (numWords - 1)))];
    stroke(getRGBA(wordLabel.label));
    line(x1, y1, x2, y2);
    // Adding interactivity
    const m = (y2 - y1) / (x2 - x1)
    const q = y2 - m * x2
    const lineMargin = 5
    if (mouseX >= min(x1, x2) && mouseX <= max(x2, x1) &&
      mouseY >= min(y1, y2) && mouseY <= max(y2, y1) &&
      m * mouseX - mouseY + q <= lineMargin) {
      const x = Math.abs(x2 - x1) / 2 + min(x1, x2)
      const y = Math.abs(y2 - y1) / 2 + min(y1, y2)
      const text_width = textWidth(wordLabel.word) + 30
      fill("white")
      rect(x-text_width/2, y-20, text_width, 30)
      textSize(16)
      stroke('black')
      fill(getRGBA(wordLabel.label))
      text(wordLabel.word, x, y)
    }
  }
}

function drawWordCommunities() {
  let wordCommunityBoundaries = [];
  strokeWeight(2);
  let previousLabel = -1;
  for (let i = 0; i <= 360; i += 360 / numWords) {
    let wordLabel = sortedWordsByLabel[int(i / (360 / (numWords-1)))];
    let label = wordLabel.label;
    if (label !== previousLabel) {
      let x1 = (radius + epsilon * 10) * cos(radians(i)) + centerX;
      let y1 = (radius + epsilon * 10) * sin(radians(i)) + centerY;
      let x2 = (radius - epsilon * 10) * cos(radians(i)) + centerX;
      let y2 = (radius - epsilon * 10) * sin(radians(i)) + centerY;
      wordCommunityBoundaries.push(i);
      stroke(getRGBA(wordLabel.label));
      line(x1, y1, x2, y2);
    }
    previousLabel = label;
  }
  wordCommunityBoundaries.push(360);
  return wordCommunityBoundaries;
}

function drawInfluencerCommunities(wordCommunityBoundaries) {
  communityCenters = [];
  for (let i = 1; i < wordCommunityBoundaries.length; i++) {
    strokeWeight(4);
    stroke(getRGBA(i - 1));
    fill(getRGBA(i - 1, 0.3));
    let communityMid = ((wordCommunityBoundaries[i] - wordCommunityBoundaries[i - 1]) / 2) + wordCommunityBoundaries[i - 1];
    let centerCommunityCircleX = (radius - communityMargin - (i % 2 === 0 ? communityMargin : 0)) * cos(radians(communityMid)) + centerX;
    let centerCommunityCircleY = (radius - communityMargin - (i % 2 === 0 ? communityMargin : 0)) * sin(radians(communityMid)) + centerY;
    let communityRadius = map(aggregatedFollowersCount[i - 1], Math.min.apply(null, aggregatedFollowersCount), Math.max.apply(null, aggregatedFollowersCount), communityRadiusMin, communityRadiusMax);
    
    circle(centerCommunityCircleX, centerCommunityCircleY, communityRadius * 2);

    communityCenters.push([centerCommunityCircleX, centerCommunityCircleY, communityRadius]);

    // write topics
    const midX = radius * cos(radians(communityMid)) + centerX;
    const midY = radius * sin(radians(communityMid)) + centerY;
    textSize(32);
    noStroke();
    fill('black');
    textAlign(midX > centerX ? LEFT : RIGHT);
    text(data.topics[i - 1][0], midX, midY)
  }
  return communityCenters;
}

function drawWordBelongness() {
  strokeWeight(1);
  for (let i = 0; i <= 360; i += 360 / numWords) {
    let word = sortedWordsByLabel[int(i / (360 / (numWords-1)))].word;
    let communities = wordBelongness[word];

    let x = radius * cos(radians(i)) + centerX;
    let y = radius * sin(radians(i)) + centerY;

    communities.forEach(community => {

      let commCenterX = communityCenters[community][0];
      let commCenterY = communityCenters[community][1];
      let commRadius = communityCenters[community][2];
      
      const alpha_color = (dist(mouseX, mouseY, commCenterX, commCenterY) <= commRadius) ? 1 : 0.1
      stroke(getRGBA(community, alpha_color));
  
      const alpha = atan((y - commCenterY) / (x - commCenterX));

      var angle;
      if (x > commCenterX) {
        angle = alpha;
      } else {
        angle = Math.PI + alpha;
      }

      let communityX = commRadius * cos(angle) + commCenterX;
      let communityY = commRadius * sin(angle) + commCenterY;
      line(x, y, communityX, communityY);
    })
  }
}

function drawTopInfluencers() {
  const PT_CONV = 1.3281472327365;
  communityCenters.forEach((comm, index) => {
    let user = sortedUsersByLabel[index][0].user
    let x = comm[0];
    let y = comm[1];
    let diameter = comm[2] * 2;

    var wordSize = 64
    textSize(wordSize);
    var wordWidth = textWidth(user);
    while (wordWidth >= diameter - 10) {
      wordSize -= 3;
      textSize(wordSize);
      wordWidth = textWidth(user);
    }

    const wordSizePx = wordSize / PT_CONV;
    fill('black');
    textAlign(CENTER);
    text(user, x, y + wordSizePx / 2);
    
  })
  
  communityCenters.forEach((comm, index) => {
    let user = sortedUsersByLabel[index][0].user
    let x = comm[0];
    let y = comm[1];
    let diameter = comm[2] * 2;
    if (dist(mouseX, mouseY, x, y) <= diameter/2) {
      const top10Users = sortedUsersByLabel[index].slice(0,10)
      fill('white')
      noStroke()
      rect(x-diameter/2-20, y-diameter/2-20, 250, 220)
      fill('black')
      textSize(16)
      textAlign(LEFT)
      top10Users.map((u, i) => {
        text(u.user, x-diameter/2, y-diameter/2 + i*20)
        text(u.followers, x-diameter/2 + 150, y-diameter/2 + i*20)
      })
    }
  })
}


function filterNumberOfWords(wordsPerLabel) {
  let newSortedWordsByLabel = []
  let currentLabel = sortedWordsByLabelOriginal[0].label
  var counter = 0;
  var i = 0
  for (i = 0; i < sortedWordsByLabelOriginal.length; i++) {
    if (sortedWordsByLabelOriginal[i].label !== currentLabel) {
      counter = 0;
      currentLabel = sortedWordsByLabelOriginal[i].label;
    }
    if (counter >= wordsPerLabel) {
      while (i < sortedWordsByLabelOriginal.length && 
             sortedWordsByLabelOriginal[i].label === currentLabel) {
        i++
      }
      if (i < sortedWordsByLabelOriginal.length)
        currentLabel = sortedWordsByLabelOriginal[i].label;
      counter = 0;
    }
    if (i < sortedWordsByLabelOriginal.length)
      newSortedWordsByLabel.push(sortedWordsByLabelOriginal[i]);
    counter++

  }
  //console.log(newSortedWordsByLabel.length)
  return newSortedWordsByLabel;
}