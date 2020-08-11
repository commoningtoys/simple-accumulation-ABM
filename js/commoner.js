class Commoner {
  /**
   * @param {Object} trait object containing the tendency to work, swap or rest
   */
  constructor(trait, vision, monthly_hours, id) {
    this.trait = trait || null
    this.vision = vision
    this.retribution = 0
    this.position = {
      x: 0,
      y: 0
    }
    this.monthly_hours = monthly_hours
    this.happiness = random_int(100)
    this.id = nf(id, 4)
    // this.collaborability = collaborability

    this.resting = false
    this.swapping = false
    this.done_for_the_month = false

    this.probabilities = {
      work: [0, 0, 0, 0, 0, 0, 1, 2],
      swap: [0, 1, 1, 1, 1, 1, 1, 2],
      rest: [0, 1, 2, 2, 2, 2, 2, 2],
      mixed: [0, 1, 2]
    }

    this.colors = {
      swap: '#f8f',
      done_for_the_month: '#0ff',
      resting: '#fc0',
      work: '#33f'
    }


    this.flip_view = false

    this.actions_memory = []
    this.init(id);
  }
  init(index) {
    const x = index % sizes.grid
    const y = parseInt((index - x) / sizes.grid)
    this.position.x = x
    this.position.y = y
    // this.position.x = random_int(sizes.grid)
    // this.position.y = random_int(sizes.grid)
  }
  move(commoners, infrastructure) {
    // console.log(infrastructure)
    // search for free spots with highest sugar amount
    // console.log(this.position)
    // look for free spots
    let search_positions = []
    const retributions = []
    // search_positions.push({x: 0, y: 0})
    for (let x = -this.vision; x <= this.vision; x++) {
      for (let y = -this.vision; y <= this.vision; y++) {
        const search_x = (this.position.x + x + sizes.grid) % sizes.grid
        const search_y = (this.position.y + y + sizes.grid) % sizes.grid
        if (this.position_available(search_x, search_y, commoners)) {

          search_positions.push({ x, y })

          retributions.push({
            retribution: infrastructure[search_x][search_y].retribution,
            pos: { x: search_x, y: search_y }
          })
        }
      }
    }
    //  console.log(retributions);

     let max = -1
     let pos = {x: this.position.x, y: this.position.y}
     for (let i = 0; i < retributions.length; i++){
       const retribution = retributions[i].retribution
       if(retribution > max){
         max = retribution
         pos = retributions[i].pos
       }
     }
    //  console.log(this.id, max, pos);
    // console.log(this.id, search_positions)
    // // look for the fields with higher value
    // let max = 0
    // const max_positions = []
    // for (const pos of search_positions) {
    //   const retribution = retributions[pos.y][pos.x]
    //   if (retribution > max) {
    //     max = retribution
    //   }
    // }
    // // console.log(max)
    // for (let y = 0; y < retributions.length; y++) {
    //   const columns = retributions[y]
    //   for (let x = 0; x < columns.length; x++) {
    //     const val = retributions[y][x]
    //     if (val >= max) {
    //       max_positions.push({ x, y })
    //     }
    //   }
    // }

    // console.log(max_positions)
    // const max_position = max_positions[random_int(max_positions.length)]
    // this.position.x += (max_position.x - this.vision)
    // this.position.y += (max_position.y - this.vision)
    // // this.position.x = max_position.x
    // // this.position.y = max_position.y
    this.position.x = pos.x
    this.position.y = pos.y
    this.edge()
    // // console.log(this.position)
    // // console.log('////////////////////')
    this.display()
  }

  position_available(x, y, commoners) {
    // const same_positions = commoners.filter(commoner => commoner.position.x === x && commoner.position.y === y)
    // console.log(same_positions.length === 0)
    // let result = false
    // for( let i = 0; i < commoners.length; i++){

    // }
    // return result
    return commoners.filter(commoner => commoner.position.x === x && commoner.position.y === y).length <= 0
  }

  edge() {
    // wrap around with modulo
    this.position.x = (this.position.x + sizes.grid) % sizes.grid
    this.position.y = (this.position.y + sizes.grid) % sizes.grid
  }

  step() {
    return -1 + random_int(3)
  }

  decision() {
    // here we use step as it returns a value between -1 and 1 
    // there is only the need to map those values to swap, work or rest
    if (this.done_for_the_month || this.resting) {
      return 'rest'
    } else if (this.swapping) {
      this.swapping = false
      return 'work'
    } else {
      let action = this.decide_action();
      const threshold = 60
      // console.log(action, this.trait);
      if (action === 'swap') {
        this.swapping = true
      } else if (action === 'rest') {
        if (this.retribution > threshold) {
          this.resting = true
          this.happiness++
          // this.retribution -= 5
          // console.log('rest')
        } else {
          this.reduce_happiness(5)
          action = 'work'
        }
      }
      this.actions_memory.push(action)
      // console.log(action)
      return action
    }
  }

  decide_action() {
    // console.log(this.probabilities[this.trait]);
    const probability = this.probabilities[this.trait]
    const prob_idx = random_int(probability.length)
    const idx = probability[prob_idx]

    return actions[idx]
  }

  reduce_happiness(val) {
    this.happiness -= val
    if (this.happiness < 0) this.happiness = 0
  }

  monthly_hours_leftover() {
    console.log('///////////////////////////');
    console.log(this.monthly_hours, this.id);
    console.log(this.happiness);
    this.happiness -= this.monthly_hours
    console.log(this.happiness);
  }

  work(hours, retribution) {
    this.retribution += retribution
    this.monthly_hours -= hours
    // if (this.monthly_hours <= 0) {
    //   this.done_for_the_month = true
    // }
  }

  get_actions_percentage() {
    const work = (this.actions_memory.filter(memory => memory === 'work').length / this.actions_memory.length) * 100
    const swap = (this.actions_memory.filter(memory => memory === 'swap').length / this.actions_memory.length) * 100
    const rest = (this.actions_memory.filter(memory => memory === 'rest').length / this.actions_memory.length) * 100
    return { work, swap, rest }
  }

  show_happiness() {
    this.flip_view = !this.flip_view
  }

  display() {


    noStroke()
    if (this.done_for_the_month) {
      fill(this.colors.done_for_the_month)
    } else if (this.resting) {
      fill(this.colors.resting)
    } else if (this.swapping) {
      fill(this.colors.swap)
    } else {
      fill(this.colors.work)
    }
    ellipse((this.position.x * sizes.cell) + (sizes.cell / 2), (this.position.y * sizes.cell) + (sizes.cell / 2), sizes.cell * 0.9)
    fill(0)
    textSize(10)
    text(Math.floor(this.retribution), (this.position.x * sizes.cell) + (sizes.cell / 4), (this.position.y * sizes.cell) + (sizes.cell / 4), sizes.cell * 0.9)



    if (this.flip_view) {

      let face = '🥳'
      if (this.happiness < 50) {
        face = '😭'
      }
      textSize(sizes.cell)
      text(face, this.position.x * sizes.cell, sizes.cell + (this.position.y * sizes.cell))
    }
  }
}