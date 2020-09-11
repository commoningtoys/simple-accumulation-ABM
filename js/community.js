class Community {
  /**
   * 
   * @param {Object} community_args {
                                      num_commoners: Number, | amount of commoners
                                      monthly_hours: Number, | hours the commoner needs to fulfill each month
                                      max_damage_value: Number, | after how much damage a common is not usable
                                      vision: Number, | how attentive the commoner is
                                      commoners_trait: String | describes the decision the commoner may do
                                  }
   */
  constructor(community_args) {

    this.monthly_hours = community_args.monthly_hours

    this.commoners_trait = community_args.commoners_trait

    this.collaborability = community_args.collaborability

    this.usage = community_args.usage

    this.damage_threshold = 255


    this.colors = {
      healty: color('#fff'),//#80dd80
      damaged: color('#000'),
      unusable: color('#f33')
    }

    this.infrastructure = this.init_infrastructure()
    this.commoners = this.init_commoners(community_args.num_commoners, community_args.vision)
    this.damaged_infrastructure = []
    this.days = 1
    this.hours = 1;

    this.max_damage_value = 255 + community_args.max_damage_value
    this.vision = community_args.vision
    this.protestant = community_args.protestant()
    // this.display()

    this.plot = new Plot(community_args.num_commoners)

    this.debug_reward_fields = true

    this.block_restore = true
  }

  init_infrastructure() {
    let arr = []
    const peaks = this.set_peaks(2)
    console.log(peaks);
    for (let i = 0; i < sizes.grid; i++) {
      let columns = []
      for (let j = 0; j < sizes.grid; j++) {
        let retribution_value = 0
        for (const center of peaks) {
          const pos = createVector(i, j)
          const d = p5.Vector.dist(pos, center)
          const planes = 4
          const spread = 0.35
          const val = planes - Math.round(map(Math.pow(d, spread), 0, Math.pow(sizes.grid, spread), 0, planes))
          // retribution_value += Math.floor(map(d, 0, sizes.grid, 1, 3))
          retribution_value += Math.pow(1 - (Math.floor(d)) / sizes.grid, 2)
          // retribution_value = constrain(retribution_value, 0, 32)
          // retribution_value = val
        }
        columns[j] = {
          value: 0,
          consumed: false,
          position: {
            x: i,
            y: j
          },
          // retribution: Math.pow(2, retribution_value),
          retribution: Math.pow(2, Math.floor(constrain(map(retribution_value, 0, 1, 1, 5), 1, 5))),
          // retribution: 0,
          max_retribution: Math.pow(2, Math.floor(constrain(map(retribution_value, 0, 1, 1, 5), 1, 5))),
          usable: true
        }
      }
      arr[i] = columns
    }
    return arr
  }

  /**
 * function to set a number of sugar field centers
 * @param {int} num number of sugarField centers
 * @returns array of p5.Vector
 */
  set_peaks(num) {
    const vector_array = new Array(num);
    for (let i = 0; i < num; i++) {
      // const x = Math.floor(Math.random() * sizes.grid);
      // const y = Math.floor(Math.random() * sizes.grid);
      // const x = sizes.grid * 0.5;
      // const y = sizes.grid * 0.5;
      const x = sizes.grid * Math.abs(i - Math.random() * 0.35);
      const y = sizes.grid * Math.abs(i - Math.random() * 0.35);
      vector_array[i] = createVector(x, y);
    }
    return vector_array;
  }

  init_commoners(num, vision) {
    const arr = []
    for (let i = 0; i < num; i++) {

      arr[i] = new Commoner(this.commoners_trait, vision, this.monthly_hours, i)
    }
    return arr
  }

  display() {
    let x = 0;
    this.infrastructure.forEach(col => {
      let y = 0
      col.forEach(row => {
        stroke(0)
        const val = Math.log2(row.retribution > 0 ? row.retribution : 1)
        let fill_color = map(val, 0, 5, 200, 25)
        if (row.consumed || !row.usable) {
          fill_color = this.colors.damaged
          // fill('#fff')
          if (!row.usable) fill_color = this.colors.unusable

        }
        //  else {
        //   // const val = Math.floor(Math.pow((row.value / this.damage_threshold), 2) * 10) / 10
        //   // fill((row.retribution * 8) % 200, 255, (1 - val) * 255, 1)


        //   // fill(row.retribution, 255, (1 - val) * 255, 1)
        //   // fill(row.retribution)
        // }
        const darkness = (1 - (row.value / this.damage_threshold)) * 255
        fill(fill_color, 255, darkness, 1)
        square(x * sizes.cell, y * sizes.cell, sizes.cell)
        fill(255)
        textSize(14)
        text(row.retribution, x * sizes.cell, y * sizes.cell, sizes.cell)
        // if (this.debug_reward_fields) this.display_reward_fields(row.retribution, x, y)
        y++
      })
      x++
    })

    // colorMode(RGB)
  }

  display_reward_fields(val, x, y) {
    // console.log(row);
    colorMode(HSB, 255, 255, 255)
    fill(val * 10 % 255, 255, 255, 0.5)
    square(x * sizes.cell, y * sizes.cell, sizes.cell)
    colorMode(RGB)
    fill(0)
    textSize(14)
    text(val, x * sizes.cell, y * sizes.cell, sizes.cell)
  }

  toggle_block_restore() {
    this.block_restore = !this.block_restore
  }

  use_infrastructure() {
    this.commoners.forEach(commoner => {
      const position = commoner.position
      this.infrastructure[position.x][position.y].value += this.usage
      // check if the position is unusable, if yes happiness decreases
      if (this.infrastructure[position.x][position.y].usable === false) {
        commoner.reduce_happiness(0.5)
      }
      // here we check whether infrastructure is consumed aka value over 255
      if (this.infrastructure[position.x][position.y].value > this.damage_threshold && !this.infrastructure[position.x][position.y].consumed) {
        this.infrastructure[position.x][position.y].consumed = true
        // this.infrastructure[position.x][position.y].retribution = this.infrastructure[position.x][position.y].max_retribution
      }
    })
  }

  restore_infrastructure() {

    // noLoop()
    const restored = []
    let index = 0
    this.damaged_infrastructure = this.get_damaged_infrastructure()
    this.damaged_infrastructure.forEach(cell => {
      const position = cell.position
      const neighbours = []
      for (let y = -this.vision; y <= this.vision; y++) {
        for (let x = -this.vision; x <= this.vision; x++) {
          noStroke()
          fill(0, 255, 0, 5)
          let pos_x = position.x + x
          let pos_y = position.y + y
          pos_x = (pos_x + sizes.grid) % sizes.grid
          pos_y = (pos_y + sizes.grid) % sizes.grid
          const neighbour = this.commoners.filter(commoner => commoner.position.x === pos_x && commoner.position.y === pos_y)
          // console.log(neighbour);
          if (neighbour.length > 0) neighbours.push(neighbour[0])
          // square(pos_x * sizes.cell, pos_y * sizes.cell, sizes.cell)
        }
      }
      const retribution = this.infrastructure[position.x][position.y].retribution
      if (this.decision_making(neighbours, retribution)) {
        // console.log('community infrastructure is restored');
        this.infrastructure[position.x][position.y].value = 0
        this.infrastructure[position.x][position.y].consumed = false
        this.infrastructure[position.x][position.y].retribution = 0
        // restored.push(index);
      }
      index++
    })
    // restored.forEach(index => this.damaged_infrastructure.splice(index, 1))
    // loop()
  }

  decision_making(neighbours, retribution) {
    const available = neighbours.filter(commoner => commoner.decision() === 'work')
    if (available.length < 1) {
      // community loses independency because no one is taking care of this
      // console.log('nooo....nobody is taking care of the community')
      return false
    }
    let chosen_commoner = []
    if (available.length > 1) {
      this.solve_conflict(available, retribution)
      // console.log(chosen_commoner);
    } else {
      // the commoner works and the infrastructure gets restored
      // the commoner uses one hour up and 
      available[0].work(0.5, retribution)
      // console.log('work', available)
    }
    // console.log(chosen_commoner)
    // chosen commoner uses his monthly hours
    // chosen_commoner.forEach(commoner => commoner.work())
    // chosen_commoner.work()
    return true
  }

  solve_conflict(available, retribution) {

    // just pick a random agent and reduce the happiness of the other/s
    const perc = Math.random()
    if (perc <= this.collaborability) {
      // console.log('collaborate');
      const hours = 0.5 / available.length
      const retribution_factor = retribution / available.length
      available.forEach(commoner => {
        commoner.work(hours, retribution_factor)
        commoner.happiness += 0.5
      })
    } else {

      // console.log('work alone');
      const rand_idx = random_int(available.length)
      available[rand_idx].work(0.5, retribution)
      // remove chosen from list
      available.splice(rand_idx, 1)
      // reduce happiness of commoners left out
      available.forEach(commoner => commoner.reduce_happiness(1))
    }
  }

  next_day() {
    this.check_infrastructure_usability()



      /*
      .########..########..######..########..#######..########..########
      .##.....##.##.......##....##....##....##.....##.##.....##.##......
      .##.....##.##.......##..........##....##.....##.##.....##.##......
      .########..######....######.....##....##.....##.########..######..
      .##...##...##.............##....##....##.....##.##...##...##......
      .##....##..##.......##....##....##....##.....##.##....##..##......
      .##.....##.########..######.....##.....#######..##.....##.########
      */

    if (this.days % 3 === 0 && this.hours === 1 && this.block_restore === false) { // here the days can be set as value to change
      this.restore_retributions()
    }
    if (this.days % 15 === 0 && this.hours === 1 && this.block_restore === true) { // here the days can be set as value to change
      this.restore_retributions_once()
    }



    this.hours++
    if (this.hours % 13 == 0) {
      this.hours = 1
      this.days++
      this.commoners.forEach(commoner => commoner.resting = false)

      this.set_plot_data()
      this.plot.update_chart()
    }
    if (this.days % 31 === 0 && this.hours % 13 == 1) {

      // this.set_plot_data()
      // this.plot.update_chart()
      this.commoners.forEach(commoner => {

        if (this.protestant) commoner.monthly_hours_leftover()
        commoner.monthly_hours = this.monthly_hours
        commoner.done_for_the_month = false
        // console.log(commoner.get_actions_percentage());
      })
      // if(this.block_restore){
      //   this.restore_retributions_once()
      // }
    }
  }

  restore_retributions() {
    for (let y = 0; y < sizes.grid; y++) {
      for (let x = 0; x < sizes.grid; x++) {
        if (this.infrastructure[x][y].usable === true) {
          if (this.infrastructure[x][y].retribution < this.infrastructure[x][y].max_retribution) {
            const max_val = parseInt(this.infrastructure[x][y].max_retribution)
            this.infrastructure[x][y].retribution += max_val / 4
          }
        } else {
          this.infrastructure[x][y].retribution = 0
        }
      }
    }

  }

  restore_retributions_once() {
    for (let y = 0; y < sizes.grid; y++) {
      for (let x = 0; x < sizes.grid; x++) {
        if (this.infrastructure[x][y].usable === true) {
            this.infrastructure[x][y].retribution = this.infrastructure[x][y].max_retribution
        } else {
          this.infrastructure[x][y].retribution = 0
        }
      }
    }

  }

  get_avg_happiness() {
    const happiness = this.commoners.map(commoner => commoner.happiness)
    // console.log(happiness);
    const sum_happiness = happiness.reduce((acc, val) => acc + val, 0)
    // console.log(sum_happiness / this.commoners.length);
    return sum_happiness / this.commoners.length
  }

  get_damaged_infrastructure() {
    const damage = []
    this.infrastructure.forEach(col => col.forEach(el => { if (el.consumed === true && el.usable === true) damage.push(el) }))
    return damage
  }

  get_unusable_infrastructure() {
    const unusable = []
    this.infrastructure.forEach(col => col.forEach(el => { if (el.consumed === true && el.usable === false) unusable.push(el) }))
    return unusable
  }

  check_infrastructure_usability() {
    this.infrastructure.forEach(col => col.forEach(el => {
      if (el.value > this.max_damage_value) {
        el.usable = false
        el.retribution = 0
      }
    }))
  }

  move_commoners() {
    for (let i = 0; i < this.commoners.length; i++) {
      const commoner = this.commoners[i]
      const retributions = this.get_retribuitions(commoner.position, commoner.vision)

      commoner.move(this.commoners, this.infrastructure)
    }
    this.use_infrastructure()
    this.restore_infrastructure()
  }

  get_retribuitions(position, vision) {
    let retributions = []
    for (let y = -vision; y <= vision; y++) {
      let values = []
      for (let x = -vision; x <= vision; x++) {
        const search_x = (position.x + x + sizes.grid) % sizes.grid
        const search_y = (position.y + y + sizes.grid) % sizes.grid
        values[x + vision] = this.infrastructure[search_x][search_y].retribution
      }
      retributions[y + vision] = values
    }
    return retributions
  }

  show_commoners() {
    // this.commoners.forEach(commoner => commoner.display())
  }

  show_commoners_happiness() {
    this.commoners.forEach(commoner => commoner.show_happiness())
  }

  set_plot_data() {
    const avg_happiness = this.get_avg_happiness()
    const damaged = (this.get_damaged_infrastructure().length / (sizes.grid * sizes.grid)) * 100
    const unusable = (this.get_unusable_infrastructure().length / (sizes.grid * sizes.grid)) * 100
    const commoners_happiness = this.commoners.map(commoner => commoner.happiness)
    this.plot.set_data(avg_happiness, commoners_happiness, damaged, unusable, this.days)
  }
}