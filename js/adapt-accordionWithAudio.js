/*
 * adapt-accordionWithAudio
 * License - http://github.com/BATraining/adapt-accordionWithAudio/blob/master/LICENSE
 * Maintainers - Kevin Corry <kevinc@learningpool.com>, Shahfaisal Patel <shahfaisal.patel@exultcorp.com>
 */
define(function(require) {

    var ComponentView = require('coreViews/componentView');
    var Adapt = require('coreJS/adapt');
    var mep = require('components/adapt-accordionWithAudio/js/mediaelement-and-player.min');

    var AccordionWithAudio = ComponentView.extend({

        events: {
            'click .accordionWithAudio-item-title': 'toggleItem',
            'click .accordionWithAudio-audio': 'onClickAudioButton'
        },

        preRender: function() {
            // Checks to see if the accordionWithAudio should be reset on revisit
            this.checkIfResetOnRevisit();
        },

        postRender: function() {
            this.$('.component-inner').on('inview', _.bind(this.inview, this));
            this.setReadyStatus();

            if($('html').hasClass('ie8')) {
                _.each(this.$('audio'), function(item, index) {
                    var audioObject = new MediaElementPlayer($(item));
                    this.model.get("_items")[index].audioObject = audioObject;
                }, this)
            }
            this.$('.mejs-container').addClass('display-none');
            this.$('audio').on('ended', _.bind(this.onAudioEnded, this));
            this.$('.accordionWithAudio-audio').hide();
        },

        // Used to check if the accordionWithAudio should reset on revisit
        checkIfResetOnRevisit: function() {
            var isResetOnRevisit = this.model.get('_isResetOnRevisit');

            // If reset is enabled set defaults
            if (isResetOnRevisit) {
                this.model.reset(isResetOnRevisit);
            }

            _.each(this.model.get('_items'), function(item) {
                item._isVisited = false;
            });
        },

        toggleItem: function(event) {
            event.preventDefault();
            var $currentSelected = $(event.currentTarget);

            this.$('.accordionWithAudio-audio').hide();
            this.$('.accordionWithAudio-item-body').stop(true, true).slideUp(200);
            if (!$currentSelected.hasClass('selected')) {
                this.$('.accordionWithAudio-item-title').removeClass('selected');
                var body = $currentSelected.addClass('selected visited').siblings('.accordionWithAudio-item-body').slideToggle(200, function() {
                    $(body).a11y_focus();
                });
                this.$('.accordionWithAudio-item-title-icon').removeClass('icon-minus').addClass('icon-plus');
                $('.accordionWithAudio-item-title-icon', event.currentTarget).removeClass('icon-plus').addClass('icon-minus');

                if ($currentSelected.hasClass('accordionWithAudio-item')) {
                    this.setVisited($currentSelected.index());
                } else {
                    this.setVisited($currentSelected.closest('.accordionWithAudio-item').index());
                }

                var currentIndex =$currentSelected.closest('.accordionWithAudio-item').index();
                if($('html').hasClass('ie8')) {
                    this.playAudioAtIndex(currentIndex);
                } else {
                    this.playAudioForElement(this.$('.accordionWithAudio-item-audio audio').eq(currentIndex)[0]);
                }

                this.$('.accordionWithAudio-sound').removeClass('icon-sound icon-sound-mute')
                this.$('.accordionWithAudio-audio').eq(currentIndex).show();
                this.$('.accordionWithAudio-sound').eq(currentIndex).addClass('icon-sound');

            } else {
                if($('html').hasClass('ie8')) {
                    this.stopAudio();
                } else {
                    this.stopCurrentAudio();
                }
                $currentSelected.removeClass('selected');
                $('.accordionWithAudio-item-title-icon', event.currentTarget).removeClass('icon-minus').addClass('icon-plus');

                this.$('.accordionWithAudio-audio').eq($currentSelected.closest('.accordionWithAudio-item').index()).hide();
                this.$('.accordionWithAudio-sound').removeClass('icon-sound icon-sound-mute');
                this.$('.accordionWithAudio-item-title').removeClass('selected');

            }
            // set aria-expanded value
            if ($currentSelected.hasClass('selected')) {
                $('.accordionWithAudio-item-title').attr('aria-expanded', false);
                $currentSelected.attr('aria-expanded', true);
            } else {
                $currentSelected.attr('aria-expanded', false);
            }
        },

        setVisited: function(index) {
            var item = this.model.get('_items')[index];
            item._isVisited = true;
            this.checkCompletionStatus();
        },

        getVisitedItems: function() {
            return _.filter(this.model.get('_items'), function(item) {
                return item._isVisited;
            });
        },

        inview: function(event, visible, visiblePartX, visiblePartY) {
            if (!visible) {
                var curIndex = this.$('.accordionWithAudio-item-title.selected').closest('.accordionWithAudio-item').index();
                this.$('.accordionWithAudio-sound').eq(curIndex).removeClass('icon-sound').addClass('icon-sound-mute');
                if($('html').hasClass('ie8')) {
                    this.stopAudio();
                } else {
                    this.stopCurrentAudio();
                }
            }
        },


        onAudioEnded: function(event) {
            var curIndex = this.$('.accordionWithAudio-item-title.selected').closest('.accordionWithAudio-item').index();
            this.$('.accordionWithAudio-sound').eq(curIndex).removeClass('icon-sound').addClass('icon-sound-mute');
            if($('html').hasClass('ie8')) {
                this.stopAudio();
            } else {
                this.model.get("_currentAudioElement").currentTime = 0.0;
                this.model.set("_currentAudioElement", '');
            }

        },

        playAudioAtIndex: function (audioObject) {
            var item = (audioObjectIndex >= 0) ? this.model.get("_items")[audioObjectIndex] : null;
            var audioObject = item ? item.audioObject : null;

            if(audioObject) {
                audioObject.play();
                this.model.set("_currentAudioObjectIndex", audioObjectIndex);
            }
        },

        stopAudio: function () {
            var index = this.model.get("_currentAudioObjectIndex");
            var item = (index >= 0) ? this.model.get("_items")[index] : null;
            var audioObject = item ? item.audioObject : null;
            if(audioObject) {
                audioObject.setCurrentTime(0);
                audioObject.pause();
                this.model.set("_currentAudioObjectIndex", -1);
            }
        },

        playAudioForElement: function(audioElement) {
            if (audioElement) {
                this.stopCurrentAudio();
                this.model.set("_currentAudioElement", audioElement);
                if(audioElement.play) audioElement.play();
            }
        },

        stopCurrentAudio: function() {
            var audioElement = this.model.get("_currentAudioElement");
            if (audioElement) {
                if (!audioElement.paused && audioElement.pause) {
                    audioElement.pause();
                }
                if (audioElement.currentTime != 0) {
                    audioElement.currentTime = 0.0;
                }
                if($('html').hasClass('ie8')) {
                    if (audioElement.getCurrentTime() != 0) {
                        audioElement.setCurrentTime(0);
                    }
                }
                this.model.set("_currentAudioElement", '');
            }
        },

        onClickAudioButton:function(event){
            if(event && event.preventDefault) event.preventDefault();
            var audioElement = this.model.get("_currentAudioElement");
            var curIndex = $(event.currentTarget).closest('.accordionWithAudio-item').index();
            if(audioElement==''){
                //var curIndex = $(event.currentTarget).closest('.accordionWithAudio-item').index();
                if($('html').hasClass('ie8')) {
                    this.playAudioAtIndex(curIndex);
                } else {
                    var audioElement = this.$('.accordionWithAudio-item-audio audio').eq(curIndex)[0];
                    this.playAudioForElement(audioElement);
                }
                //this.$('.accordionWithAudio-sound').removeClass('icon-sound-mute');
                this.$('.accordionWithAudio-sound').eq(curIndex).addClass('icon-sound');
                this.$('.accordionWithAudio-sound').eq(curIndex).removeClass('icon-sound-mute');
            }else {
                if($('html').hasClass('ie8')) {
                    this.stopAudio();
                } else {
                    this.stopCurrentAudio();
                }
                //this.$('.accordionWithAudio-sound').addClass('icon-sound-mute');
                this.$('.accordionWithAudio-sound').eq(curIndex).addClass('icon-sound-mute');

            }
        },

        checkCompletionStatus: function() {
            if (!this.model.get('_isComplete')) {
                if (this.getVisitedItems().length == this.model.get('_items').length) {
                    this.setCompletionStatus();
                }
            }
        }

    });

    Adapt.register('accordionWithAudio', AccordionWithAudio);

    return AccordionWithAudio;

});
