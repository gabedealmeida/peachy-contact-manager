$(function () {
  const API = {
    getAllContacts() {
      $.ajax({
        url: 'http://localhost:3000/api/contacts',
        success(json) {
          ContactsManager.addFromServer(json);
          TagsManager.parseFromServer(json);
          Form.addTagsFromServer(TagsManager.listCopy());
          UI.displayHomePageOnLoad();
          UI.addTagsToDropdown();
        },
      });
    },

    addContact(contact) {
      $.ajax({
        url: 'http://localhost:3000/api/contacts/',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(contact),
        success(json) {
          ContactsManager.addFromServer(json);
          Form.displayHomePageOnContactFormSubmit();
          UI.addTagsToDropdown();
        },
      });
    },

    deleteContact(id) {
      $.ajax({
        url: `http://localhost:3000/api/contacts/${id}`,
        method: 'DELETE',
        data: id,
        success() {
          ContactsManager.remove(id);
          UI.removeContact(id);
        },
      });
    },

    editContact(id, contact) {
      $.ajax({
        url: `http://localhost:3000/api/contacts/${id}`,
        contentType: 'application/json',
        method: 'PUT',
        data: JSON.stringify(contact),
        success(json) {
          ContactsManager.editContact(json);
          Form.displayHomePageOnEditFormSubmit();
        },
      });
    },
  };

  const Contact = (function () {
    const profileEmoji = ['🐯', '🍔', '🦀', '💎', '🎈', '🎉', '🏄‍♂️',
      '🦊', '🦄', '🦉', '🐝', '🌻', '🌺', '🦑', '🍄', '🌈', '⚡',
      '🔥', '🌊', '🏖️', '⛺', '🎡', '🛰️', '🚀', '🛸', '🪐', '🚣',
      '🤹', '🎗️', '🎟️', '🎯', '🎱', '🎮', '🎰', '🎨', '🧶', '☀',
      '🙃', '🤩', '🤗', '🤠', '🤯', '🥳', '😎', '👽', '👻', '👾',
      '👹', '🤖', '🤙', '🙌', '🦾', '🧠', '🧜', '💃', '🕺', '👔',
      '👑'];
    
    return {
      profileEmojiGenerator() {
        const randNum = Math.floor(Math.random() * profileEmoji.length);
        this.profileEmoji = profileEmoji[randNum];
      },
  
      formatTags(obj) {
        if (obj.tags) {
          this.tags = obj.tags.split(',').join(', ');
        } else {
          this.tags = obj.tags;
        }
      },

      editContact(obj) {
        this.fullName = obj.full_name;
        this.email = obj.email;
        this.phoneNumber = obj.phone_number;
        this.formatTags(obj);
        return this;
      },
  
      init(obj) {
        this.id = obj.id;
        this.fullName = obj.full_name;
        this.email = obj.email;
        this.phoneNumber = obj.phone_number;
        this.formatTags(obj);
        this.profileEmojiGenerator();
        return this;
      },
    };
  }());

  const ContactsManager = {
    list: [],

    length() {
      return this.list.length;
    },

    contactCopy(contact) {
      return { ...contact };
    },

    listCopy() {
      return this.list.map((contact) => this.contactCopy(contact));
    },

    lastContact() {
      return this.contactCopy(this.list[this.length() - 1]);
    },

    findContactCopy(id) {
      const copyOfList = this.listCopy();

      for (let i = 0; i < this.length(); i += 1) {
        if (copyOfList[i].id === Number(id)) {
          return copyOfList[i];
        }
      }

      return null;
    },

    findContact(id) {
      for (let i = 0; i < this.length(); i += 1) {
        if (this.list[i].id === Number(id)) {
          return this.list[i];
        }
      }

      return null;
    },

    findAllMatchingContacts(arr) {
      const matchedContacts = [];

      arr.forEach((id) => {
        matchedContacts.push(this.findContactCopy(id));
      });

      return matchedContacts;
    },

    remove(id) {
      const list = this.list;

      for (let i = 0; i < this.length(); i += 1) {
        if (list[i].id === Number(id)) {
          list.splice(i, 1);
          break;
        }
      }
    },

    sortList() {
      this.list.sort((a, b) => {
        return a.fullName.toLowerCase() > b.fullName.toLowerCase() ? 1 : -1;
      });
    },

    addToList(obj) {
      const contact = Object.create(Contact).init(obj);
      this.list.push(contact);
    },

    addFromForm(formObj) {
      API.addContact(formObj);
    },

    updateFromForm(contactID, formObj) {
      formObj.id = contactID;
      API.editContact(contactID, formObj);
    },

    editContact(json) {
      const contact = this.findContact(json.id);
      contact.editContact(json);
      UI.editContact(contact);
    },

    addFromServer(contacts) {
      if (Array.isArray(contacts)) {
        contacts.forEach((contact) => {
          this.addToList(contact);
        });
      } else {
        this.addToList(contacts);
      }

      this.sortList();
    },

    init() {
      API.getAllContacts();
      return this;
    },
  };

  const Tag = {
    init(tagStr) {
      this.tagName = tagStr;
      this.id = tagStr.split(' ').join('_');
      return this;
    },
  };

  const TagsManager = {
    list: [],

    listCopy() {
      return this.list.map((tagObj) => {
        return { id: tagObj.id, tagName: tagObj.tagName };
      });
    },

    listTagStrings() {
      return this.listCopy().map((tagObj) => tagObj.tagName);
    },

    sortList() {
      this.list.sort((a, b) => {
        return a.tagName.toLowerCase() > b.tagName.toLowerCase() ? 1 : -1;
      });
    },

    tagStringToArray(tagString) {
      return tagString.trim()
        .split(',')
        .map((tag) => {
          const trimmedTag = tag.trim();
          if (trimmedTag === '') return '';
          return trimmedTag;
        }).filter((tag) => tag);
    },

    addToList(tagString) {
      const tagsArr = this.listTagStrings();
      const tagsAdded = [];

      this.tagStringToArray(tagString).forEach((tag) => {
        if (!tagsArr.includes(tag)) {
          const tagObj = Object.create(Tag).init(tag);
          this.list.push(tagObj);
          tagsAdded.push(tagObj);
        }
      });

      this.sortList();
      return tagsAdded;
    },

    parseFromServer(allContacts) {
      allContacts.forEach((contact) => {
        if (contact.tags) {
          this.addToList(contact.tags);
        }
      });
    },

    parseFromForm(tagString) {
      return this.addToList(tagString);
    },
  };

  const Search = (function() {
    let previousTagSearchLength;
    let tagsAreApplied = false;
    let visibleAfterTagsAreApplied = [];

    return {
      findAllMatchingContactsByName(nameStr, contacts) {
        if (nameStr === "") return contacts;

        return contacts.filter((contact) => {
          const contactName = contact.fullName.toLowerCase();
          const pattern = new RegExp(`${nameStr}`, 'gi');
          return contactName.match(pattern);
        });
      },

      findAllMatchingContactsByTags(selectedTags, contacts) {
        if (contacts === undefined) {
          contacts = ContactsManager.listCopy();
        }

        return contacts.filter((contact) => {
          const tagsArr = contact.tags.split(', ');
          return selectedTags.every((tag) => {
            return tagsArr.includes(tag);
          });
        });
      },

      findAllVisibleContactIDs() {
        const arr = [];
  
        $('[data-contact-id^="contact_"]').each(function() {
          const $contactCard = $(this);
          const idStr = $contactCard.attr('data-contact-id').replace(/contact_/, '');
          arr.push(Number(idStr));
        });
  
        return arr;
      },
  
      contactsMatchingTags(selectedTags) {
        const previousSeachLength = previousTagSearchLength;
        const searchStr = App.$searchBar[0].value;
        let contacts;
        previousTagSearchLength = selectedTags.length;

        if (previousSeachLength > selectedTags.length) {
          if (searchStr) {
            contacts = this.findAllMatchingContactsByName(searchStr, ContactsManager.listCopy());
          }
            visibleAfterTagsAreApplied = this.findAllMatchingContactsByTags(selectedTags, contacts);
          } else {
          const contactIDs = this.findAllVisibleContactIDs();
          contacts = ContactsManager.findAllMatchingContacts(contactIDs);
          visibleAfterTagsAreApplied = this.findAllMatchingContactsByTags (selectedTags, contacts);
        }

        if (selectedTags.length === 0) {
          tagsAreApplied = false;
        } else {
          tagsAreApplied = true;
        }

        return visibleAfterTagsAreApplied;
      },

      contactsMatchingName(nameStr) {
        let contacts = ContactsManager.listCopy();

        if (visibleAfterTagsAreApplied.length === 0 && tagsAreApplied) {
          return [];
        } else if (visibleAfterTagsAreApplied.length > 0 && tagsAreApplied) {
          contacts = visibleAfterTagsAreApplied;
        }

        return this.findAllMatchingContactsByName(nameStr, contacts);
      },
    };
  }());

  const Form = {
    addTagsContainerToForm() {
      App.$checkboxContainer.insertAfter($('#create_tag_area'));
    },

    appendTagsToTagArea(arrayOfTags) {
      App.$innerTagArea.append(App.templates.all_tags({ tags: arrayOfTags }));
    },

    addTagsFromServer(copyOfTags) {
      this.appendTagsToTagArea(copyOfTags);
    },

    checkTags(tagsArr) {
      $('[name=tags]').each(function() {
        const $input = $(this);
        const inputTag = $input.attr('value');
        tagsArr.forEach((tag) => {
          if (inputTag === tag.tagName || inputTag === tag) {
            $input.prop('checked', true);
          }
        });
      });
    },

    uncheckTags() {
      $('[name=tags]').each(function() {
        const $input = $(this);
        $input.prop('checked', false);
      });
    },

    addTagsFromTagField(e) {
      e.preventDefault();
      const $createTagInput = $('#create_tag');
      const tags = $createTagInput.val();
      const uniquefTags = TagsManager.parseFromForm(tags);
      $createTagInput.val('');
      this.appendTagsToTagArea(uniquefTags);
      this.checkTags(TagsManager.tagStringToArray(tags));
    },

    allEntriesValid(formObj) {
      return formObj.full_name && formObj.email && formObj.phone_number;
    },

    serializeFormInput(formInput) {
      const formObj = $(formInput).serializeArray().reduce((obj, input) => {
        if (obj[input.name]) {
          obj[input.name] += `,${input.value}`;
        } else {
          obj[input.name] = input.value;
        }
        return obj;
      }, {});

      if (formObj.tags === undefined) {
        formObj.tags = '';
      }

      return formObj;
    },

    submitForm(e) {
      e.preventDefault();
      const form = $(e.target);
      const contactID = Number(form.attr('action').split('/').slice(-1)[0]);
      const formObj = this.serializeFormInput(form);

      if (this.allEntriesValid(formObj)) {
        if ($(form).attr('data-form') === 'contact_form') {
          ContactsManager.addFromForm(formObj);
        } else {
          ContactsManager.updateFromForm(contactID, formObj);
        }
      }

      this.uncheckTags();
    },

    cancelForm(e) {
      e.preventDefault();
      this.uncheckTags();
      this.hideForm();
    },

    displayHomePageOnContactFormSubmit() {
      if (ContactsManager.length() === 1) {
        UI.removeNoContactsSectionFromHome();
      }

      UI.renderContacts('all');
      this.hideForm();
    },

    displayHomePageOnEditFormSubmit() {
      this.hideForm();
    },

    buildContactForm() {
      const contactFormObj = { method: 'POST', action: 'http://localhost:3000/api/contacts/', formType: "contact_form", title: 'Create Contact', nameValue: '', emailValue: '', telephoneValue: '' };
      
      App.$formSection.html('');
      App.$formSection.append(App.templates.form(contactFormObj));
      this.addTagsContainerToForm();
    },

    buildEditForm(contact) {
      const editFormObj = { method: 'PUT',
        action: `http://localhost:3000/api/contacts/${contact.id}`,
        formType: "edit_form", title: 'Edit Contact',
        nameValue: contact.fullName, emailValue: contact.email,
        telephoneValue: contact.phoneNumber };
      
      App.$formSection.html('');
      App.$formSection.append(App.templates.form(editFormObj));
      this.addTagsContainerToForm();
      this.checkTags(contact.tags.split(', '));
    },

    hideForm() {
      UI.slideUpEffect(App.$formSection, App.$main);
    },

    bindEvents() {
      App.$formSection.on('submit', 'form', $.proxy(this.submitForm, this));
      App.$formSection.on('click', '#cancel_btn', $.proxy(this.cancelForm, this));
      App.$formSection.on('click', '#create_tags_btn', $.proxy(this.addTagsFromTagField, this));
    },

    init() {
      this.bindEvents();
    },
  };

  const UI = {
    addNoContactsSectionToHome() {
      App.$main.append(App.templates.no_contacts_section());
    },

    removeNoContactsSectionFromHome() {
      if ($('#no_contacts').length > 0) {
        $('#no_contacts').remove();
      }
    },

    removeAllContacts() {
      $('#all_contact_cards').remove();
    },

    renderContacts(display, obj) {
      let contacts;
      this.removeAllContacts();

      if (display === 'all') {
        contacts = ContactsManager.listCopy();
      } else {
        contacts = obj;
      }

      App.$main.append(App.templates.contacts_display({ contacts }));
    },

    findContactOnPage(id) {
      return $(`[data-contact-id=contact_${id}]`);
    },

    removeContact(id) {
      this.findContactOnPage(id).remove();
      if (ContactsManager.length() === 0) {
        this.addNoContactsSectionToHome();
      }
    },

    editContact(contact) {
      const $contact = this.findContactOnPage(contact.id);
      $contact.replaceWith(App.templates.contact_card(contact));
    },

    displayHomePageOnLoad() {
      if (ContactsManager.length() === 0) {
        this.addNoContactsSectionToHome();
        this.slideDownHomePage();
      } else {
        this.renderContacts('all');
        App.$main.slideDown(500);
      }
    },

    slideDownHomePage() {
      App.$main.slideDown(500);
    },

    slideUpEffect(old, current) {
      old.hide();
      current.show('slide', { direction: 'down' }, 500);
    },

    slideUpContactForm() {
      Form.buildContactForm();
      this.slideUpEffect(App.$main, App.$formSection);
    },

    slideUpEditForm(contactObj) {
      Form.buildEditForm(contactObj);
      this.slideUpEffect(App.$main, App.$formSection);
    },

    locateContactIdFromButton(e) {
      const ID = $(e.target).parents()
        .eq(2)
        .attr('data-contact-id')
        .replace(/contact_(\d+)/, '$1');
      
      return ID;
    },

    editForm(e) {
      e.preventDefault();
      const contactCardID = this.locateContactIdFromButton(e);
      const contactObj = ContactsManager.findContact(contactCardID);
      this.slideUpEditForm(contactObj);
    },

    deleteContact(e) {
      e.preventDefault();
      const confirmation = window.confirm('Do you want to delete the contact?');

      if (confirmation) {
        const contactCardID = this.locateContactIdFromButton(e);
        API.deleteContact(contactCardID);
      }
    },

    addTagsToDropdown() {
      App.$dropdownTagArea.html('');
      const tags = TagsManager.listCopy();
      App.$dropdownTagArea.append(App.templates.filter_tags_btn({ tags }));
    },

    findAllDropdownTags() {
      return App.$dropdownTagArea.serializeArray().reduce((arr, input) => {
        arr.push(input.value);
        return arr;
      }, []);
    },

    filterByTagsAndDisplayContacts(e) {
      e.preventDefault();
      const contactsArr = Search.contactsMatchingTags(this.findAllDropdownTags());
      UI.renderContacts('some', contactsArr);
    },

    filterByNamesAndDisplayContacts(e) {
      e.preventDefault();
      const searchStr = App.$searchBar[0].value;
      const contactsArr = Search.contactsMatchingName(searchStr);
      UI.renderContacts('some', contactsArr);
    },

    bindEvents() {
      App.$document.on('click', 'button.add_contact', $.proxy(this.slideUpContactForm, this));
      App.$dropdownTagArea.on('input', $.proxy(this.filterByTagsAndDisplayContacts, this));
      App.$searchBar.on('keyup', $.proxy(this.filterByNamesAndDisplayContacts, this));
      App.$document.on('click', 'button.edit', $.proxy(this.editForm, this));
      App.$document.on('click', 'button.delete', $.proxy(this.deleteContact, this));
    },

    init() {
      this.bindEvents();
    },
  };

  const App = {
    $document: $(document),
    $main: $('main'),
    $filterBtn: $('#filterBtn'),
    $dropdownTagArea: $('#filterBtn + div form'),
    $searchBar: $('#search_bar'),
    $formSection: $('section.form'),
    $checkboxContainer: $('#checkbox_container'),
    $innerTagArea: $('#inner_tag_area'),
    templates: {},

    initializeTemplates() {
      const $allTemplates = $('[type="text/x-handlebars"]');
      const $partialTemplates = $('[data-type="partial"]');

      $allTemplates.each((idx) => {
        const $template = $allTemplates.eq(idx);
        this.templates[$template.attr('id')] = Handlebars.compile($template.html());
      });

      $partialTemplates.each((idx) => {
        const $partial = $partialTemplates.eq(idx);
        Handlebars.registerPartial($partial.attr('id'), $partial.html());
      });
    },

    init() {
      ContactsManager.init();
      this.initializeTemplates();
      UI.init();
      Form.init();
    },
  };

  App.init();
});
