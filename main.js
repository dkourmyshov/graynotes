var Note = Backbone.Model.extend({
  defaults: {
    text: '',
    updated: Firebase.ServerValue.TIMESTAMP
  }
});

var Notes = Backbone.Firebase.Collection.extend({
  url: 'https://luminous-heat-8038.firebaseio.com/notes',
  autosync: true,
  comparator: 'updated',
  model: Note,
  setCurrent: function (note) {
    this.current = note;
    this.trigger('sync');
  },
  current: null
});


var EditorView = Backbone.View.extend({
  initialize: function () {
    this.collection.on('sync', this.render.bind(this));
  },
  events: {
    'input': 'inputHandler'
  },
  inputHandler: function (event) {
    this.model.set({
      text: event.target.value,
      updated: Firebase.ServerValue.TIMESTAMP
    });
    this.model.collection.sort();
  },
  render: function () {
    if ((this.model = this.collection.current) !== null) {
      this.$el.val(this.model.get('text'));
    }
  }
});

var NotesListItem = Backbone.View.extend({
  template: _.template('<heading><%= title %></heading><br><span class="timestamp"><%= date %></span>'),
  tagName: 'li',
  events: {
    'click': 'clickHandler'
  },
  clickHandler: function () {
    this.model.collection.setCurrent(this.model);
  },
  render: function () {
    var title = this.model.get('text').match(/.*/)[0];
    if (title === '') { title = 'untitled'; }
    this.$el.html(this.template({
      title: title,
      date: $.timeago(new Date(this.model.get('updated')))
    }));
    if (this.model === this.model.collection.current) {
      this.$el.addClass('selected');
    }
    return this;
  }
});

var NotesListView = Backbone.View.extend({
  initialize: function () {
    this.collection.on('sync', this.render.bind(this));
  },
  render: function () {
    var note_list = this;
    this.$el.empty(); //How to avoid this?
    this.collection.each(function (note) {
      note_list.$el.prepend(new NotesListItem({model: note}).render().$el);
    });
  }
});


$(document).ready(function () {
  var notes = new Notes();
  notes.on('sync', function () {
    if (notes.models.length > 0 && notes.current === null &&
      notes.models[notes.models.length - 1] !== null) {
      notes.setCurrent(notes.models[notes.models.length - 1]);
    }
  });

  var editor = new EditorView({
    collection: notes,
    el: $('textarea')[0]
  });
  var notes_list = new NotesListView({
    collection: notes,
    el: $('#notes_list')[0]
  });

  $('#create_note').click(function () {
    notes.setCurrent(notes.get(notes.create({}).id));
  });
  $('#delete_note').click(function () {
    if (notes.models.length > 0) {
      notes.remove(notes.current);
      notes.setCurrent(notes.models[notes.models.length - 1]);
    }
  });
});