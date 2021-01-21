class VocabulariesController < ApplicationController
  before_action :require_levelbuilder_mode_or_test_env, except: [:show]

  # GET /vocabularysearch
  def search
    render json: VocabularyAutocomplete.get_search_matches(params[:query], params[:limit], params[:courseVersionId])
  end

  # POST /vocabularies
  def create
    course_version = CourseVersion.find_by_id(vocabulary_params[:course_version_id])
    unless course_version
      render status: 400, json: {error: "course version not found"}
      return
    end
    vocabulary = Vocabulary.new(
      word: vocabulary_params[:word],
      definition: vocabulary_params[:definition]
    )
    vocabulary.course_version = course_version
    if vocabulary.save
      render json: vocabulary.summarize_for_lesson_edit
    else
      render status: 400, json: {error: vocabulary.errors.full_message.to_json}
    end
  end

  private

  def vocabulary_params
    vp = params.transform_keys(&:underscore)
    vp = vp.permit(:word, :definition, :course_version_id)
    vp
  end
end
